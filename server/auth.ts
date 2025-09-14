import type { Express, RequestHandler } from "express";
import session from "express-session";
import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import bcrypt from "bcrypt";
import { storage } from "./storage";
import connectPg from "connect-pg-simple";

// Configure session store
export function getSession() {
  const sessionTtl = 7 * 24 * 60 * 60 * 1000; // 1 week
  const pgStore = connectPg(session);
  const sessionStore = new pgStore({
    conString: process.env.DATABASE_URL,
    createTableIfMissing: true,
    ttl: sessionTtl,
    tableName: "sessions",
  });

  // Generate a strong session secret if not provided
  const sessionSecret =
    process.env.SESSION_SECRET || process.env.NODE_ENV === "production"
      ? (() => {
          throw new Error("SESSION_SECRET must be set in production!");
        })()
      : "dev-session-secret-" + Math.random().toString(36).substring(2, 15);

  return session({
    secret: process.env.SESSION_SECRET || "your-secret-key-change-this",
    store: sessionStore,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production", // Secure in production
      sameSite: "strict", // CSRF protection
      maxAge: sessionTtl,
    },
  });
}

// Configure passport local strategy
passport.use(
  new LocalStrategy(
    {
      usernameField: "email",
      passwordField: "password",
    },
    async (email, password, done) => {
      try {
        const user = await storage.getUserByEmail(email);
        if (!user) {
          return done(null, false, { message: "Email não encontrado" });
        }

        const isValidPassword = await bcrypt.compare(password, user.password);
        if (!isValidPassword) {
          return done(null, false, { message: "Senha incorreta" });
        }

        return done(null, user);
      } catch (error) {
        return done(error);
      }
    }
  )
);

passport.serializeUser((user: any, done) => {
  // Store both ID and role to know which table to query during deserialization
  done(null, { id: user.id, role: user.role });
});

passport.deserializeUser(async (sessionData: any, done) => {
  try {
    let user;

    if (process.env.NODE_ENV === "development") {
      console.log("DEBUG deserializeUser - sessionData:", sessionData);
    }

    // Handle legacy sessions that only have ID (assume teacher/user)
    if (typeof sessionData === "string") {
      user = await storage.getUser(sessionData);
      if (process.env.NODE_ENV === "development") {
        console.log("DEBUG deserializeUser - legacy user lookup:", !!user);
      }
    } else {
      // New sessions have {id, role}
      if (sessionData.role === "student") {
        const student = await storage.getStudent(sessionData.id);
        if (process.env.NODE_ENV === "development") {
          console.log("DEBUG deserializeUser - student lookup:", !!student);
        }
        if (student) {
          // Convert student to user-like object for consistency
          user = {
            id: student.id,
            email: student.email,
            role: "student",
            firstName: student.name.split(" ")[0] || student.name,
            lastName: student.name.split(" ").slice(1).join(" ") || "",
          };
          if (process.env.NODE_ENV === "development") {
            console.log(
              "DEBUG deserializeUser - converted student to user:",
              user
            );
          }
        }
      } else {
        user = await storage.getUser(sessionData.id);
        if (process.env.NODE_ENV === "development") {
          console.log("DEBUG deserializeUser - teacher/user lookup:", !!user);
        }
      }
    }

    if (!user) {
      if (process.env.NODE_ENV === "development") {
        console.log("DEBUG deserializeUser - no user found, returning false");
      }
      return done(null, false);
    }

    if (process.env.NODE_ENV === "development") {
      console.log(
        "DEBUG deserializeUser - success, returning user with role:",
        user.role
      );
    }
    done(null, user);
  } catch (error) {
    console.error("Erro ao deserializar usuário:", error);
    done(null, false);
  }
});

export async function setupAuth(app: Express) {
  app.use(getSession());
  app.use(passport.initialize());
  app.use(passport.session());

  // Login route
  app.post("/api/login", passport.authenticate("local"), (req, res) => {
    res.json({ success: true, user: req.user });
  });

  // Student registration route (with invite token validation)
  app.post("/api/student/register", async (req, res) => {
    try {
      const { email, password, confirmPassword, inviteToken } = req.body;

      // Validate required fields
      if (!email || !password || !confirmPassword || !inviteToken) {
        return res.status(400).json({
          message:
            "Email, senha, confirmação de senha e código de convite são obrigatórios",
        });
      }

      // Validate password confirmation
      if (password !== confirmPassword) {
        return res.status(400).json({
          message: "Senha e confirmação não coincidem",
        });
      }

      // Validate password strength
      if (password.length < 6) {
        return res.status(400).json({
          message: "A senha deve ter pelo menos 6 caracteres",
        });
      }

      // Find student by invite token AND verify email matches
      const student = await storage.getStudentByInviteToken(inviteToken);

      if (!student || student.email !== email) {
        return res.status(400).json({
          message: "Código de convite inválido ou email não corresponde",
        });
      }

      if (!student.isInvitePending) {
        return res.status(400).json({
          message: "Este aluno já possui cadastro",
        });
      }

      // Complete registration with token validation
      const registeredStudent = await storage.completeStudentRegistration(
        email,
        password
      );

      if (!registeredStudent) {
        return res.status(400).json({
          message: "Erro ao completar o registro",
        });
      }

      // Convert student to user-like object for session
      const userLikeStudent = {
        id: registeredStudent.id,
        email: registeredStudent.email,
        role: "student",
        firstName:
          registeredStudent.name.split(" ")[0] || registeredStudent.name,
        lastName: registeredStudent.name.split(" ").slice(1).join(" ") || "",
      };

      // Automatically log in the student after registration
      req.login(userLikeStudent, (err) => {
        if (err) {
          console.error(
            "Error establishing student session after registration:",
            err
          );
          return res.status(500).json({
            message: "Cadastro realizado, mas erro ao estabelecer sessão",
          });
        }

        res.json({
          success: true,
          user: userLikeStudent,
          message: "Cadastro realizado com sucesso!",
        });
      });
    } catch (error) {
      console.error("Student registration error:", error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  // Student-specific login route
  app.post("/api/student/login", async (req, res) => {
    try {
      const { email, password } = req.body;

      const student = await storage.validateStudentPassword(email, password);

      if (!student) {
        return res.status(401).json({ message: "Email ou senha incorretos" });
      }

      // Convert student to user-like object for session
      const userLikeStudent = {
        id: student.id,
        email: student.email,
        role: "student",
        firstName: student.name.split(" ")[0] || student.name,
        lastName: student.name.split(" ").slice(1).join(" ") || "",
      };

      // Use passport to establish session
      req.login(userLikeStudent, (err) => {
        if (err) {
          console.error("Error establishing student session:", err);
          return res
            .status(500)
            .json({ message: "Erro ao estabelecer sessão" });
        }

        res.json({ success: true, user: userLikeStudent });
      });
    } catch (error) {
      console.error("Student login error:", error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  // Logout route
  app.post("/api/logout", (req, res) => {
    req.logout((err) => {
      if (err) {
        return res.status(500).json({ message: "Erro ao fazer logout" });
      }
      res.json({ success: true });
    });
  });

  // Register route
  app.post("/api/register", async (req, res) => {
    try {
      const { email, password, firstName, lastName, role } = req.body;

      // Validate required fields
      if (!email || !password || !firstName || !lastName || !role) {
        return res
          .status(400)
          .json({ message: "Todos os campos são obrigatórios" });
      }

      // Validate role
      if (!["teacher", "student"].includes(role)) {
        return res
          .status(400)
          .json({ message: "Role deve ser teacher ou student" });
      }

      // Check if user already exists
      const existingUser = await storage.getUserByEmail(email);
      if (existingUser) {
        return res.status(400).json({ message: "Email já está em uso" });
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10);

      // Create user
      const user = await storage.createUser({
        email,
        password: hashedPassword,
        firstName,
        lastName,
        role: role as "teacher" | "student",
      });

      // Note: Students who self-register only exist in the 'users' table.
      // Students in the 'students' table are only those registered by teachers.

      // Log the user in
      req.login(user, (err) => {
        if (err) {
          return res.status(500).json({ message: "Erro ao fazer login" });
        }
        res.json({ success: true, user });
      });
    } catch (error) {
      console.error("Registration error:", error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });
}

export const isAuthenticated: RequestHandler = (req, res, next) => {
  if (req.isAuthenticated()) {
    return next();
  }
  res.status(401).json({ message: "Não autorizado" });
};

// Middleware para verificar se o usuário é professor (acesso completo)
export const isTeacher: RequestHandler = (req: any, res, next) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ message: "Não autorizado" });
  }

  if (req.user.role !== "teacher") {
    return res.status(403).json({
      message:
        "Acesso negado. Apenas professores podem acessar esta funcionalidade.",
    });
  }

  return next();
};

// Middleware para verificar se o usuário é aluno ou professor (acesso específico)
export const isStudentOrTeacher: RequestHandler = (req: any, res, next) => {
  if (!req.isAuthenticated()) {
    console.log("[DEBUG] Authentication failed - user not authenticated");
    return res.status(401).json({ message: "Não autorizado" });
  }

  console.log("[DEBUG] User authenticated:", {
    id: req.user?.id,
    role: req.user?.role,
  });

  if (!["teacher", "student"].includes(req.user.role)) {
    console.log("[DEBUG] Access denied - invalid role:", req.user.role);
    return res.status(403).json({ message: "Acesso negado" });
  }

  console.log("[DEBUG] Authorization successful for role:", req.user.role);
  return next();
};
