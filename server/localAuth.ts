import type { Express, RequestHandler } from "express";
import session from "express-session";

// Mock user para desenvolvimento local
const mockUser = {
  id: "local-dev-user",
  email: "dev@localhost.com",
  firstName: "Dev",
  lastName: "User",
  profileImageUrl: null,
  createdAt: new Date(),
  updatedAt: new Date(),
};

export function getSession() {
  return session({
    secret: process.env.SESSION_SECRET || "dev-secret-123",
    resave: false,
    saveUninitialized: true,
    cookie: {
      httpOnly: true,
      secure: false, // false para development
      maxAge: 7 * 24 * 60 * 60 * 1000, // 1 week
    },
  });
}

export async function setupAuth(app: Express) {
  app.use(getSession());

  // Simulação de login para desenvolvimento
  app.get("/api/login", (req, res) => {
    res.redirect("/");
  });

  // GET logout route (redirects)
  app.get("/api/logout", (req, res) => {
    req.session.destroy(() => {
      res.redirect("/");
    });
  });

  // POST logout route (returns JSON for frontend)
  app.post("/api/logout", (req, res) => {
    req.session.destroy(() => {
      res.json({ success: true, message: "Logged out successfully" });
    });
  });
}

export const isAuthenticated: RequestHandler = async (req: any, res, next) => {
  // Para desenvolvimento, sempre considera autenticado com usuário mock
  req.user = {
    id: mockUser.id,
    email: mockUser.email,
    firstName: mockUser.firstName,
    lastName: mockUser.lastName,
    role: "teacher", // Default role for development
    claims: {
      sub: mockUser.id,
      email: mockUser.email,
      first_name: mockUser.firstName,
      last_name: mockUser.lastName,
      profile_image_url: mockUser.profileImageUrl,
    },
  };

  next();
};

export const isTeacher: RequestHandler = async (req: any, res, next) => {
  // Para desenvolvimento, sempre permite acesso de professor
  req.user = {
    id: mockUser.id,
    email: mockUser.email,
    firstName: mockUser.firstName,
    lastName: mockUser.lastName,
    role: "teacher",
    claims: {
      sub: mockUser.id,
      email: mockUser.email,
      first_name: mockUser.firstName,
      last_name: mockUser.lastName,
      profile_image_url: mockUser.profileImageUrl,
    },
  };

  next();
};

export const isStudentOrTeacher: RequestHandler = async (
  req: any,
  res,
  next
) => {
  // Para desenvolvimento, sempre permite acesso
  req.user = {
    id: mockUser.id,
    email: mockUser.email,
    firstName: mockUser.firstName,
    lastName: mockUser.lastName,
    role: "teacher", // Default role for development
    claims: {
      sub: mockUser.id,
      email: mockUser.email,
      first_name: mockUser.firstName,
      last_name: mockUser.lastName,
      profile_image_url: mockUser.profileImageUrl,
    },
  };

  next();
};
