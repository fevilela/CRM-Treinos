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
  updatedAt: new Date()
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

  app.get("/api/logout", (req, res) => {
    req.session.destroy(() => {
      res.redirect("/");
    });
  });
}

export const isAuthenticated: RequestHandler = async (req: any, res, next) => {
  // Para desenvolvimento, sempre considera autenticado com usuário mock
  req.user = {
    claims: {
      sub: mockUser.id,
      email: mockUser.email,
      first_name: mockUser.firstName,
      last_name: mockUser.lastName,
      profile_image_url: mockUser.profileImageUrl
    }
  };
  
  next();
};