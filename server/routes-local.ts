import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./localAuth";
import {
  insertStudentSchema,
  insertWorkoutSchema,
  insertExerciseSchema,
  insertExerciseTemplateSchema,
  insertWorkoutSessionSchema,
  insertExercisePerformanceSchema,
  insertBodyMeasurementSchema,
} from "@shared/schema";
import { z } from "zod";
import bcrypt from "bcrypt";

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware
  await setupAuth(app);

  // Garante que o usuário mock existe no banco
  app.use("/api", async (req: any, res, next) => {
    try {
      const userId = "local-dev-user";
      const existingUser = await storage.getUser(userId);

      if (!existingUser) {
        const hashedPassword = await bcrypt.hash("dev123", 10);
        await storage.createUser({
          email: "dev@localhost.com",
          password: hashedPassword,
          firstName: "Dev",
          lastName: "User",
          role: "teacher",
          profileImageUrl: null,
        });
      }
    } catch (error) {
      console.error("Error ensuring user exists:", error);
    }
    next();
  });

  // Auth routes
  app.get("/api/auth/user", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Student auth route - get current student data
  app.get("/api/auth/student/me", isAuthenticated, async (req: any, res) => {
    try {
      // For local development, check if user has student role
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);

      if (!user || user.role !== "student") {
        return res.status(403).json({ message: "Access denied" });
      }

      // First try to find student in students table (registered by teacher)
      const studentRecord = await storage.getStudentByEmail(user.email);

      if (studentRecord) {
        // Student exists in students table (registered by teacher)
        const { password, inviteToken, ...sanitizedStudent } = studentRecord;
        res.json({ success: true, student: sanitizedStudent });
      } else {
        // Student is self-registered (only exists in users table)
        // Create a student-like object from user data
        const studentData = {
          id: user.id, // Use user ID as student ID
          name: `${user.firstName} ${user.lastName}`,
          email: user.email,
          personalTrainerId: null, // Self-registered students don't have a trainer initially
          // Add other required student fields as needed
          gender: null,
          dateOfBirth: null,
          phone: null,
          goals: null,
          status: "active" as const,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt,
        };

        res.json({ success: true, student: studentData });
      }
    } catch (error) {
      console.error("Error fetching student data:", error);
      res.status(500).json({
        success: false,
        message: "Failed to fetch student data",
      });
    }
  });

  // Dashboard stats
  app.get("/api/dashboard/stats", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const stats = await storage.getDashboardStats(userId);
      res.json(stats);
    } catch (error) {
      console.error("Error fetching dashboard stats:", error);
      res.status(500).json({ message: "Failed to fetch dashboard stats" });
    }
  });

  // Student routes
  app.get("/api/students", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const students = await storage.getStudents(userId);
      res.json(students);
    } catch (error) {
      console.error("Error fetching students:", error);
      res.status(500).json({ message: "Failed to fetch students" });
    }
  });

  app.get("/api/students/:id", isAuthenticated, async (req, res) => {
    try {
      const student = await storage.getStudent(req.params.id);
      if (!student) {
        return res.status(404).json({ message: "Student not found" });
      }
      res.json(student);
    } catch (error) {
      console.error("Error fetching student:", error);
      res.status(500).json({ message: "Failed to fetch student" });
    }
  });

  app.post("/api/students", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const validatedData = insertStudentSchema.parse({
        ...req.body,
        personalTrainerId: userId,
      });
      const student = await storage.createStudent(validatedData);
      res.json(student);
    } catch (error) {
      console.error("Error creating student:", error);
      res.status(500).json({ message: "Failed to create student" });
    }
  });

  app.put("/api/students/:id", isAuthenticated, async (req, res) => {
    try {
      const validatedData = insertStudentSchema.partial().parse(req.body);
      const student = await storage.updateStudent(req.params.id, validatedData);
      if (!student) {
        return res.status(404).json({ message: "Student not found" });
      }
      res.json(student);
    } catch (error) {
      console.error("Error updating student:", error);
      res.status(500).json({ message: "Failed to update student" });
    }
  });

  app.delete("/api/students/:id", isAuthenticated, async (req, res) => {
    try {
      await storage.deleteStudent(req.params.id);
      res.json({ message: "Student deleted successfully" });
    } catch (error) {
      console.error("Error deleting student:", error);
      res.status(500).json({ message: "Failed to delete student" });
    }
  });

  // Workout routes
  app.get("/api/workouts", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const workouts = await storage.getWorkouts(userId);
      res.json(workouts);
    } catch (error) {
      console.error("Error fetching workouts:", error);
      res.status(500).json({ message: "Failed to fetch workouts" });
    }
  });

  app.get("/api/workouts/:id", isAuthenticated, async (req, res) => {
    try {
      const workout = await storage.getWorkout(req.params.id);
      if (!workout) {
        return res.status(404).json({ message: "Workout not found" });
      }
      const exercises = await storage.getWorkoutExercises(req.params.id);
      res.json({ ...workout, exercises });
    } catch (error) {
      console.error("Error fetching workout:", error);
      res.status(500).json({ message: "Failed to fetch workout" });
    }
  });

  app.post("/api/workouts", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { exercises, ...workoutData } = req.body;

      const validatedWorkoutData = insertWorkoutSchema.parse({
        ...workoutData,
        personalTrainerId: userId,
      });

      const workout = await storage.createWorkout(validatedWorkoutData);

      // Criar exercícios se fornecidos
      if (exercises && exercises.length > 0) {
        for (const exercise of exercises) {
          const validatedExercise = insertExerciseSchema.parse({
            ...exercise,
            workoutId: workout.id,
          });
          await storage.createExercise(validatedExercise);
        }
      }

      res.json(workout);
    } catch (error) {
      console.error("Error creating workout:", error);
      res.status(500).json({ message: "Failed to create workout" });
    }
  });

  app.put("/api/workouts/:id", isAuthenticated, async (req, res) => {
    try {
      const { exercises, ...workoutData } = req.body;
      const validatedWorkoutData = insertWorkoutSchema
        .partial()
        .parse(workoutData);

      const workout = await storage.updateWorkout(
        req.params.id,
        validatedWorkoutData
      );
      if (!workout) {
        return res.status(404).json({ message: "Workout not found" });
      }
      res.json(workout);
    } catch (error) {
      console.error("Error updating workout:", error);
      res.status(500).json({ message: "Failed to update workout" });
    }
  });

  app.delete("/api/workouts/:id", isAuthenticated, async (req, res) => {
    try {
      await storage.deleteWorkout(req.params.id);
      res.json({ message: "Workout deleted successfully" });
    } catch (error) {
      console.error("Error deleting workout:", error);
      res.status(500).json({ message: "Failed to delete workout" });
    }
  });

  // Workout Session routes
  app.get("/api/workout-sessions", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const sessions = await storage.getWorkoutSessions(userId);
      res.json(sessions);
    } catch (error) {
      console.error("Error fetching workout sessions:", error);
      res.status(500).json({ message: "Failed to fetch workout sessions" });
    }
  });

  app.get("/api/recent-sessions", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const sessions = await storage.getWorkoutSessions(userId);
      // Retorna apenas as 5 mais recentes
      const recentSessions = sessions.slice(0, 5);
      res.json(recentSessions);
    } catch (error) {
      console.error("Error fetching recent sessions:", error);
      res.status(500).json({ message: "Failed to fetch recent sessions" });
    }
  });

  app.post("/api/workout-sessions", isAuthenticated, async (req, res) => {
    try {
      const { performances, ...sessionData } = req.body;
      const validatedSessionData =
        insertWorkoutSessionSchema.parse(sessionData);

      const session = await storage.createWorkoutSession(validatedSessionData);

      // Criar performances se fornecidas
      if (performances && performances.length > 0) {
        for (const performance of performances) {
          const validatedPerformance = insertExercisePerformanceSchema.parse({
            ...performance,
            sessionId: session.id,
          });
          await storage.createExercisePerformance(validatedPerformance);
        }
      }

      res.json(session);
    } catch (error) {
      console.error("Error creating workout session:", error);
      res.status(500).json({ message: "Failed to create workout session" });
    }
  });

  // Workout routes for students
  app.get(
    "/api/workouts/student/:studentId",
    isAuthenticated,
    async (req, res) => {
      try {
        const { studentId } = req.params;
        const workouts = await storage.getStudentWorkouts(studentId);
        res.json(workouts);
      } catch (error) {
        console.error("Error fetching student workouts:", error);
        res.status(500).json({ message: "Failed to fetch student workouts" });
      }
    }
  );

  // Workout history routes (for student progress tracking)
  app.get(
    "/api/workout-history/:studentId",
    isAuthenticated,
    async (req, res) => {
      try {
        const { studentId } = req.params;
        const { exerciseId } = req.query;
        const history = await storage.getWorkoutHistory(
          studentId,
          exerciseId as string
        );
        res.json(history);
      } catch (error) {
        console.error("Error fetching workout history:", error);
        res.status(500).json({ message: "Failed to fetch workout history" });
      }
    }
  );

  app.post("/api/workout-history", isAuthenticated, async (req, res) => {
    try {
      const validatedData = req.body; // Temporarily skip validation for local dev
      const history = await storage.createWorkoutHistory(validatedData);
      res.json(history);
    } catch (error) {
      console.error("Error creating workout history:", error);
      res.status(500).json({ message: "Failed to create workout history" });
    }
  });

  // Body Measurement routes
  app.get(
    "/api/body-measurements/:studentId",
    isAuthenticated,
    async (req, res) => {
      try {
        // Retorna array vazio por enquanto - pode ser implementado depois
        res.json([]);
      } catch (error) {
        console.error("Error fetching body measurements:", error);
        res.status(500).json({ message: "Failed to fetch body measurements" });
      }
    }
  );

  // Rota para obter o student record do usuário autenticado
  app.get("/api/student/me", isAuthenticated, async (req, res) => {
    try {
      // No ambiente local, simula buscar student baseado no user
      const userEmail = "dev@localhost.com";

      // Busca student record baseado no email
      const student = await storage.getStudentByEmail(userEmail);
      if (!student) {
        return res.status(404).json({
          message: "Student record not found. Please contact your trainer.",
        });
      }

      res.json(student);
    } catch (error) {
      console.error("Error fetching student record:", error);
      res.status(500).json({ message: "Failed to fetch student record" });
    }
  });

  // Physical Assessment routes
  app.get(
    "/api/physical-assessments",
    isAuthenticated,
    async (req: any, res) => {
      try {
        const userId = req.user.claims.sub;
        const assessments = await storage.getPhysicalAssessments(userId);
        res.json(assessments);
      } catch (error) {
        console.error("Error fetching physical assessments:", error);
        res
          .status(500)
          .json({ message: "Failed to fetch physical assessments" });
      }
    }
  );

  // Secure endpoint for students and teachers to get their own assessments
  app.get(
    "/api/physical-assessments/me",
    isAuthenticated,
    async (req: any, res) => {
      try {
        const user = await storage.getUser(req.user.claims.sub);
        if (!user) {
          return res.status(404).json({ message: "User not found" });
        }

        // Se for um professor, retorna todos os assessments seus
        if (user.role === "teacher") {
          const assessments = await storage.getPhysicalAssessments(user.id);
          res.json(assessments);
          return;
        }

        // Se for um aluno, busca o student record e retorna apenas seus assessments
        const student = await storage.getStudentByEmail(user.email);
        if (!student) {
          return res.status(404).json({ message: "Student not found" });
        }

        const assessments = await storage.getStudentPhysicalAssessments(
          student.id
        );
        res.json(assessments);
      } catch (error) {
        console.error("Error fetching my physical assessments:", error);
        res
          .status(500)
          .json({ message: "Failed to fetch physical assessments" });
      }
    }
  );

  app.post("/api/body-measurements", isAuthenticated, async (req, res) => {
    try {
      const validatedData = insertBodyMeasurementSchema.parse(req.body);
      const measurement = await storage.createBodyMeasurement(validatedData);
      res.json(measurement);
    } catch (error) {
      console.error("Error creating body measurement:", error);
      res.status(500).json({ message: "Failed to create body measurement" });
    }
  });

  // Progress tracking routes
  app.get("/api/progress/:studentId", isAuthenticated, async (req, res) => {
    try {
      // Retorna dados mock de progresso por enquanto
      const progress = {
        workoutCount: 0,
        exerciseCount: 0,
        progressData: [],
      };
      res.json(progress);
    } catch (error) {
      console.error("Error fetching student progress:", error);
      res.status(500).json({ message: "Failed to fetch student progress" });
    }
  });

  // Exercise template routes
  app.get("/api/exercise-templates", isAuthenticated, async (req, res) => {
    try {
      const templates = await storage.getExerciseTemplates();
      res.json(templates);
    } catch (error) {
      console.error("Error fetching exercise templates:", error);
      res.status(500).json({ message: "Failed to fetch exercise templates" });
    }
  });

  app.get(
    "/api/exercise-templates/search",
    isAuthenticated,
    async (req, res) => {
      try {
        const query = (req.query.q as string) || "";
        const templates = await storage.searchExerciseTemplates(query);
        res.json(templates);
      } catch (error) {
        console.error("Error searching exercise templates:", error);
        res
          .status(500)
          .json({ message: "Failed to search exercise templates" });
      }
    }
  );

  app.post("/api/exercise-templates", isAuthenticated, async (req, res) => {
    try {
      const validatedData = insertExerciseTemplateSchema.parse(req.body);
      const template = await storage.createExerciseTemplate(validatedData);
      res.json(template);
    } catch (error) {
      console.error("Error creating exercise template:", error);
      res.status(500).json({ message: "Failed to create exercise template" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
