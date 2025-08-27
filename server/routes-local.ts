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
  insertBodyMeasurementSchema
} from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware
  await setupAuth(app);

  // Garante que o usuário mock existe no banco
  app.use('/api', async (req: any, res, next) => {
    try {
      const userId = "local-dev-user";
      const existingUser = await storage.getUser(userId);
      
      if (!existingUser) {
        await storage.upsertUser({
          id: userId,
          email: "dev@localhost.com",
          firstName: "Dev",
          lastName: "User",
          profileImageUrl: null,
        });
      }
    } catch (error) {
      console.error("Error ensuring user exists:", error);
    }
    next();
  });

  // Auth routes
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Dashboard stats
  app.get('/api/dashboard/stats', isAuthenticated, async (req: any, res) => {
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
  app.get('/api/students', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const students = await storage.getStudents(userId);
      res.json(students);
    } catch (error) {
      console.error("Error fetching students:", error);
      res.status(500).json({ message: "Failed to fetch students" });
    }
  });

  app.get('/api/students/:id', isAuthenticated, async (req, res) => {
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

  app.post('/api/students', isAuthenticated, async (req: any, res) => {
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

  app.put('/api/students/:id', isAuthenticated, async (req, res) => {
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

  app.delete('/api/students/:id', isAuthenticated, async (req, res) => {
    try {
      await storage.deleteStudent(req.params.id);
      res.json({ message: "Student deleted successfully" });
    } catch (error) {
      console.error("Error deleting student:", error);
      res.status(500).json({ message: "Failed to delete student" });
    }
  });

  // Workout routes
  app.get('/api/workouts', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const workouts = await storage.getWorkouts(userId);
      res.json(workouts);
    } catch (error) {
      console.error("Error fetching workouts:", error);
      res.status(500).json({ message: "Failed to fetch workouts" });
    }
  });

  app.get('/api/workouts/:id', isAuthenticated, async (req, res) => {
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

  app.post('/api/workouts', isAuthenticated, async (req: any, res) => {
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

  app.put('/api/workouts/:id', isAuthenticated, async (req, res) => {
    try {
      const { exercises, ...workoutData } = req.body;
      const validatedWorkoutData = insertWorkoutSchema.partial().parse(workoutData);
      
      const workout = await storage.updateWorkout(req.params.id, validatedWorkoutData);
      if (!workout) {
        return res.status(404).json({ message: "Workout not found" });
      }
      res.json(workout);
    } catch (error) {
      console.error("Error updating workout:", error);
      res.status(500).json({ message: "Failed to update workout" });
    }
  });

  app.delete('/api/workouts/:id', isAuthenticated, async (req, res) => {
    try {
      await storage.deleteWorkout(req.params.id);
      res.json({ message: "Workout deleted successfully" });
    } catch (error) {
      console.error("Error deleting workout:", error);
      res.status(500).json({ message: "Failed to delete workout" });
    }
  });

  // Workout Session routes
  app.get('/api/workout-sessions', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const sessions = await storage.getWorkoutSessions(userId);
      res.json(sessions);
    } catch (error) {
      console.error("Error fetching workout sessions:", error);
      res.status(500).json({ message: "Failed to fetch workout sessions" });
    }
  });

  app.get('/api/recent-sessions', isAuthenticated, async (req: any, res) => {
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

  app.post('/api/workout-sessions', isAuthenticated, async (req, res) => {
    try {
      const { performances, ...sessionData } = req.body;
      const validatedSessionData = insertWorkoutSessionSchema.parse(sessionData);
      
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

  // Body Measurement routes
  app.get('/api/body-measurements/:studentId', isAuthenticated, async (req, res) => {
    try {
      // Retorna array vazio por enquanto - pode ser implementado depois
      res.json([]);
    } catch (error) {
      console.error("Error fetching body measurements:", error);
      res.status(500).json({ message: "Failed to fetch body measurements" });
    }
  });

  app.post('/api/body-measurements', isAuthenticated, async (req, res) => {
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
  app.get('/api/progress/:studentId', isAuthenticated, async (req, res) => {
    try {
      // Retorna dados mock de progresso por enquanto
      const progress = {
        workoutCount: 0,
        exerciseCount: 0,
        progressData: []
      };
      res.json(progress);
    } catch (error) {
      console.error("Error fetching student progress:", error);
      res.status(500).json({ message: "Failed to fetch student progress" });
    }
  });

  // Exercise template routes
  app.get('/api/exercise-templates', isAuthenticated, async (req, res) => {
    try {
      const templates = await storage.getExerciseTemplates();
      res.json(templates);
    } catch (error) {
      console.error("Error fetching exercise templates:", error);
      res.status(500).json({ message: "Failed to fetch exercise templates" });
    }
  });

  app.get('/api/exercise-templates/search', isAuthenticated, async (req, res) => {
    try {
      const query = req.query.q as string || '';
      const templates = await storage.searchExerciseTemplates(query);
      res.json(templates);
    } catch (error) {
      console.error("Error searching exercise templates:", error);
      res.status(500).json({ message: "Failed to search exercise templates" });
    }
  });

  app.post('/api/exercise-templates', isAuthenticated, async (req, res) => {
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