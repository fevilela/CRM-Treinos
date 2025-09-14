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

  return session({
    secret: process.env.SESSION_SECRET || "your-secret-key-change-this",
    store: sessionStore,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: false, // Set to true in production with HTTPS
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
  done(null, user.id);
});

passport.deserializeUser(async (id: string, done) => {
  try {
    const user = await storage.getUser(id);
    if (!user) {
      // Usuário foi excluído, limpar a sessão
      return done(null, false);
    }
    done(null, user);
  } catch (error) {
    console.error("Erro ao deserializar usuário:", error);
    done(null, false); // Retorna false ao invés de error para evitar crash
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
    return res.status(401).json({ message: "Não autorizado" });
  }

  if (!["teacher", "student"].includes(req.user.role)) {
    return res.status(403).json({ message: "Acesso negado" });
  }

  return next();
};
