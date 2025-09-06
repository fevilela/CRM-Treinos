import express, { type Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import {
  setupAuth,
  isAuthenticated,
  isTeacher,
  isStudentOrTeacher,
} from "./auth";
import {
  insertStudentSchema,
  insertWorkoutSchema,
  insertExerciseSchema,
  insertExerciseTemplateSchema,
  insertWorkoutSessionSchema,
  insertExercisePerformanceSchema,
  insertBodyMeasurementSchema,
  insertWorkoutHistorySchema,
  insertWorkoutCommentSchema,
  insertPhysicalAssessmentSchema,
  insertAssessmentPhotoSchema,
} from "@shared/schema";
import { z } from "zod";
import multer from "multer";
import { promises as fs } from "fs";
import path from "path";

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware
  await setupAuth(app);

  // Auth routes
  app.get("/api/auth/user", isAuthenticated, async (req: any, res) => {
    try {
      res.json(req.user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Rota para limpar sessões órfãs (desenvolvimento)
  app.post("/api/auth/clear-sessions", async (req, res) => {
    if (process.env.NODE_ENV !== "development") {
      return res
        .status(403)
        .json({ message: "Só disponível em desenvolvimento" });
    }
    try {
      // Aqui você pode limpar sessões específicas se necessário
      res.json({ message: "Sessões limpas com sucesso" });
    } catch (error) {
      console.error("Error clearing sessions:", error);
      res.status(500).json({ message: "Failed to clear sessions" });
    }
  });

  // Dashboard stats
  app.get("/api/dashboard/stats", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const stats = await storage.getDashboardStats(userId);
      res.json(stats);
    } catch (error) {
      console.error("Error fetching dashboard stats:", error);
      res.status(500).json({ message: "Failed to fetch dashboard stats" });
    }
  });

  // Student routes (apenas professores podem gerenciar alunos)
  app.get("/api/students", isTeacher, async (req: any, res) => {
    try {
      const userId = req.user.id;
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

  app.post("/api/students", isTeacher, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const { sendInviteEmail, ...studentData } = req.body;

      const validatedData = insertStudentSchema.parse({
        ...studentData,
        personalTrainerId: userId,
        inviteToken: null,
        isInvitePending: false,
        password: null, // Alunos não precisam de senha inicialmente
      });

      const student = await storage.createStudent(validatedData);
      res.json(student);
    } catch (error) {
      console.error("Error creating student:", error);
      res.status(500).json({ message: "Failed to create student" });
    }
  });

  app.put("/api/students/:id", isTeacher, async (req, res) => {
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

  app.delete("/api/students/:id", isTeacher, async (req, res) => {
    try {
      await storage.deleteStudent(req.params.id);
      res.json({ message: "Student deleted successfully" });
    } catch (error) {
      console.error("Error deleting student:", error);
      res.status(500).json({ message: "Failed to delete student" });
    }
  });

  // Workout routes (apenas professores podem criar/gerenciar treinos)
  app.get("/api/workouts", isTeacher, async (req: any, res) => {
    try {
      const userId = req.user.id;
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

  app.post("/api/workouts", isTeacher, async (req: any, res) => {
    try {
      console.log("POST /api/workouts - Raw request body:", req.body);
      console.log("POST /api/workouts - User ID:", req.user?.id);

      const userId = req.user.id;
      const { exercises, ...workoutData } = req.body;

      console.log("POST /api/workouts - Workout data:", workoutData);
      console.log("POST /api/workouts - Exercises:", exercises);

      const validatedWorkoutData = insertWorkoutSchema.parse({
        ...workoutData,
        personalTrainerId: userId,
      });

      console.log("POST /api/workouts - Validated data:", validatedWorkoutData);

      const workout = await storage.createWorkout(validatedWorkoutData);

      console.log("POST /api/workouts - Created workout:", workout);

      // Criar exercícios se fornecidos
      if (exercises && exercises.length > 0) {
        for (const exercise of exercises) {
          const exerciseData = {
            ...exercise,
            workoutId: workout.id,
            weight:
              typeof exercise.weight === "number"
                ? exercise.weight.toString()
                : exercise.weight,
          };

          const validatedExercise = insertExerciseSchema.parse(exerciseData);
          await storage.createExercise(validatedExercise);
        }
      }

      res.json(workout);
    } catch (error: any) {
      console.error("Error creating workout - FULL ERROR:", error);
      console.error("Error stack:", error.stack);
      console.error("Error name:", error.name);

      // Log validation errors more clearly
      if (error.name === "ZodError") {
        console.error("Zod validation errors:", error.errors);
        return res.status(400).json({
          message: "Validation error",
          errors: error.errors,
        });
      }

      // Log database errors more clearly
      if (error.code) {
        console.error("Database error code:", error.code);
        console.error("Database error detail:", error.detail);
      }

      res.status(500).json({
        message: "Failed to create workout",
        error: error.message,
        errorName: error.name,
      });
    }
  });

  app.put("/api/workouts/:id", isAuthenticated, async (req, res) => {
    try {
      const { exercises, ...workoutData } = req.body;
      console.log("PUT /api/workouts/:id - Request data:", {
        workoutId: req.params.id,
        exercises: exercises?.length || 0,
        workoutData,
      });

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

      // Delete existing exercises and create new ones if provided
      if (exercises && exercises.length > 0) {
        console.log("Updating exercises for workout:", req.params.id);
        // First, delete all existing exercises for this workout
        await storage.deleteWorkoutExercises(req.params.id);
        console.log("Deleted existing exercises");

        // Then create new exercises
        for (let i = 0; i < exercises.length; i++) {
          const exercise = exercises[i];
          console.log(`Creating exercise ${i + 1}:`, exercise);

          const exerciseData = {
            ...exercise,
            workoutId: req.params.id,
            weight:
              typeof exercise.weight === "number"
                ? exercise.weight.toString()
                : exercise.weight,
          };

          console.log(`Exercise data before validation:`, exerciseData);

          const validatedExercise = insertExerciseSchema.parse(exerciseData);
          console.log(`Validated exercise:`, validatedExercise);
          const createdExercise = await storage.createExercise(
            validatedExercise
          );
          console.log(`Created exercise:`, createdExercise);
        }
        console.log("All exercises created successfully");
      } else {
        console.log("No exercises to update");
      }

      res.json(workout);
    } catch (error: any) {
      console.error("Error updating workout:", error);
      console.error("Error stack:", error.stack);
      res.status(500).json({
        message: "Failed to update workout",
        error: error.message,
      });
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

  // Workout routes for students
  app.get(
    "/api/workouts/student/:studentId",
    isStudentOrTeacher,
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

  // Workout Session routes
  app.get("/api/workout-sessions", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const sessions = await storage.getWorkoutSessions(userId);
      res.json(sessions);
    } catch (error) {
      console.error("Error fetching workout sessions:", error);
      res.status(500).json({ message: "Failed to fetch workout sessions" });
    }
  });

  app.get("/api/recent-sessions", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
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

  // Student authentication routes
  app.post("/api/auth/student/login", async (req, res) => {
    try {
      const { email, password } = req.body;
      const student = await storage.validateStudentPassword(email, password);

      if (student) {
        res.json({ success: true, student });
      } else {
        res
          .status(401)
          .json({ success: false, message: "Invalid credentials" });
      }
    } catch (error) {
      console.error("Error logging in student:", error);
      res.status(500).json({ message: "Failed to login" });
    }
  });

  // Student invite verification and password setup
  app.get("/api/students/invite/:token", async (req, res) => {
    try {
      const { token } = req.params;
      const student = await storage.getStudentByInviteToken(token);

      if (!student || !student.isInvitePending) {
        return res
          .status(404)
          .json({ message: "Convite inválido ou já utilizado" });
      }

      res.json({
        studentName: student.name,
        email: student.email,
        valid: true,
      });
    } catch (error) {
      console.error("Error validating invite token:", error);
      res.status(500).json({ message: "Failed to validate invite" });
    }
  });

  app.post("/api/students/setup-password", async (req, res) => {
    try {
      const { token, password } = req.body;

      if (!token || !password) {
        return res
          .status(400)
          .json({ message: "Token e senha são obrigatórios" });
      }

      const student = await storage.getStudentByInviteToken(token);
      if (!student || !student.isInvitePending) {
        return res
          .status(404)
          .json({ message: "Convite inválido ou já utilizado" });
      }

      // Hash da senha
      const bcrypt = await import("bcrypt");
      const hashedPassword = await bcrypt.hash(password, 10);

      const updatedStudent = await storage.updateStudentPassword(
        student.id,
        hashedPassword
      );

      res.json({
        success: true,
        message: "Senha configurada com sucesso",
        student: updatedStudent,
      });
    } catch (error) {
      console.error("Error setting up password:", error);
      res.status(500).json({ message: "Failed to setup password" });
    }
  });

  // Workout history routes (for student progress tracking)
  app.get(
    "/api/workout-history/:studentId",
    isStudentOrTeacher,
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

  app.post("/api/workout-history", isStudentOrTeacher, async (req, res) => {
    try {
      const validatedData = insertWorkoutHistorySchema.parse(req.body);
      const history = await storage.createWorkoutHistory(validatedData);
      res.json(history);
    } catch (error) {
      console.error("Error creating workout history:", error);
      res.status(500).json({ message: "Failed to create workout history" });
    }
  });

  app.get(
    "/api/exercise-progress/:studentId/:exerciseId",
    isStudentOrTeacher,
    async (req, res) => {
      try {
        const { studentId, exerciseId } = req.params;
        const progress = await storage.getExerciseProgress(
          studentId,
          exerciseId
        );
        res.json(progress);
      } catch (error) {
        console.error("Error fetching exercise progress:", error);
        res.status(500).json({ message: "Failed to fetch exercise progress" });
      }
    }
  );

  // Workout comments routes
  app.get(
    "/api/workout-comments/:workoutSessionId",
    isStudentOrTeacher,
    async (req, res) => {
      try {
        const { workoutSessionId } = req.params;
        const comments = await storage.getWorkoutComments(workoutSessionId);
        res.json(comments);
      } catch (error) {
        console.error("Error fetching workout comments:", error);
        res.status(500).json({ message: "Failed to fetch workout comments" });
      }
    }
  );

  app.post("/api/workout-comments", isStudentOrTeacher, async (req, res) => {
    try {
      const validatedData = insertWorkoutCommentSchema.parse(req.body);
      const comment = await storage.createWorkoutComment(validatedData);
      res.json(comment);
    } catch (error) {
      console.error("Error creating workout comment:", error);
      res.status(500).json({ message: "Failed to create workout comment" });
    }
  });

  app.put("/api/workout-comments/:id", isStudentOrTeacher, async (req, res) => {
    try {
      const { id } = req.params;
      const validatedData = insertWorkoutCommentSchema
        .partial()
        .parse(req.body);
      const comment = await storage.updateWorkoutComment(id, validatedData);
      res.json(comment);
    } catch (error) {
      console.error("Error updating workout comment:", error);
      res.status(500).json({ message: "Failed to update workout comment" });
    }
  });

  app.delete(
    "/api/workout-comments/:id",
    isStudentOrTeacher,
    async (req, res) => {
      try {
        const { id } = req.params;
        await storage.deleteWorkoutComment(id);
        res.json({ message: "Comment deleted successfully" });
      } catch (error) {
        console.error("Error deleting workout comment:", error);
        res.status(500).json({ message: "Failed to delete workout comment" });
      }
    }
  );

  // Physical Assessment routes
  app.get("/api/physical-assessments", isTeacher, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const assessments = await storage.getPhysicalAssessments(userId);
      res.json(assessments);
    } catch (error) {
      console.error("Error fetching physical assessments:", error);
      res.status(500).json({ message: "Failed to fetch physical assessments" });
    }
  });

  app.get(
    "/api/students/:studentId/physical-assessments",
    isAuthenticated,
    async (req: any, res) => {
      try {
        const assessments = await storage.getStudentPhysicalAssessments(
          req.params.studentId
        );
        res.json(assessments);
      } catch (error) {
        console.error("Error fetching student physical assessments:", error);
        res
          .status(500)
          .json({ message: "Failed to fetch student physical assessments" });
      }
    }
  );

  app.get(
    "/api/physical-assessments/:id",
    isAuthenticated,
    async (req, res) => {
      try {
        const assessment = await storage.getPhysicalAssessment(req.params.id);
        if (!assessment) {
          return res
            .status(404)
            .json({ message: "Physical assessment not found" });
        }
        res.json(assessment);
      } catch (error) {
        console.error("Error fetching physical assessment:", error);
        res
          .status(500)
          .json({ message: "Failed to fetch physical assessment" });
      }
    }
  );

  app.post("/api/physical-assessments", isTeacher, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const validatedData = insertPhysicalAssessmentSchema.parse({
        ...req.body,
        personalTrainerId: userId,
      });

      const assessment = await storage.createPhysicalAssessment(validatedData);
      res.status(201).json(assessment);
    } catch (error) {
      console.error("Error creating physical assessment:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          message: "Validation failed",
          errors: error.errors.map((e) => ({
            field: e.path.join("."),
            message: e.message,
          })),
        });
      }
      res.status(500).json({ message: "Failed to create physical assessment" });
    }
  });

  app.put("/api/physical-assessments/:id", isTeacher, async (req: any, res) => {
    try {
      const assessmentId = req.params.id;

      // Verify assessment exists and belongs to the teacher
      const existingAssessment = await storage.getPhysicalAssessment(
        assessmentId
      );
      if (!existingAssessment) {
        return res
          .status(404)
          .json({ message: "Physical assessment not found" });
      }

      if (existingAssessment.personalTrainerId !== req.user.id) {
        return res.status(403).json({ message: "Access denied" });
      }

      // Remove personalTrainerId from body to prevent changes
      const { personalTrainerId, ...updateData } = req.body;

      const validatedData = insertPhysicalAssessmentSchema
        .partial()
        .parse(updateData);
      const assessment = await storage.updatePhysicalAssessment(
        assessmentId,
        validatedData
      );

      res.json(assessment);
    } catch (error) {
      console.error("Error updating physical assessment:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          message: "Validation failed",
          errors: error.errors.map((e) => ({
            field: e.path.join("."),
            message: e.message,
          })),
        });
      }
      res.status(500).json({ message: "Failed to update physical assessment" });
    }
  });

  app.delete(
    "/api/physical-assessments/:id",
    isTeacher,
    async (req: any, res) => {
      try {
        const assessmentId = req.params.id;

        // Verify assessment exists and belongs to the teacher
        const existingAssessment = await storage.getPhysicalAssessment(
          assessmentId
        );
        if (!existingAssessment) {
          return res
            .status(404)
            .json({ message: "Physical assessment not found" });
        }

        if (existingAssessment.personalTrainerId !== req.user.id) {
          return res.status(403).json({ message: "Access denied" });
        }

        await storage.deletePhysicalAssessment(assessmentId);
        res.status(204).send();
      } catch (error) {
        console.error("Error deleting physical assessment:", error);
        res
          .status(500)
          .json({ message: "Failed to delete physical assessment" });
      }
    }
  );

  // Get assessment history for a specific student
  app.get(
    "/api/assessment-history/:studentId",
    isAuthenticated,
    async (req: any, res) => {
      try {
        const studentId = req.params.studentId;
        const history = await storage.getStudentAssessmentHistory(studentId);
        res.json(history);
      } catch (error) {
        console.error("Error fetching assessment history:", error);
        res.status(500).json({ message: "Failed to fetch assessment history" });
      }
    }
  );

  // Get assessment history for a specific assessment
  app.get(
    "/api/physical-assessments/:id/history",
    isAuthenticated,
    async (req: any, res) => {
      try {
        const assessmentId = req.params.id;
        const history = await storage.getPhysicalAssessmentHistory(
          assessmentId
        );
        res.json(history);
      } catch (error) {
        console.error("Error fetching assessment history:", error);
        res.status(500).json({ message: "Failed to fetch assessment history" });
      }
    }
  );

  // Get all assessment history for a student
  app.get(
    "/api/students/:studentId/assessment-history",
    isAuthenticated,
    async (req: any, res) => {
      try {
        const studentId = req.params.studentId;
        const history = await storage.getStudentAssessmentHistory(studentId);
        res.json(history);
      } catch (error) {
        console.error("Error fetching student assessment history:", error);
        res
          .status(500)
          .json({ message: "Failed to fetch student assessment history" });
      }
    }
  );

  // Configure multer for photo uploads
  const uploadsDir = path.join(process.cwd(), "uploads", "assessment-photos");

  // Ensure uploads directory exists
  await fs.mkdir(uploadsDir, { recursive: true });

  const storage_multer = multer.diskStorage({
    destination: uploadsDir,
    filename: (req, file, cb) => {
      const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
      const ext = path.extname(file.originalname);
      cb(null, `photo-${uniqueSuffix}${ext}`);
    },
  });

  const upload = multer({
    storage: storage_multer,
    limits: {
      fileSize: 10 * 1024 * 1024, // 10MB limit
    },
    fileFilter: (req, file, cb) => {
      if (!file.mimetype.startsWith("image/")) {
        return cb(new Error("Apenas arquivos de imagem são permitidos"));
      }
      cb(null, true);
    },
  });

  // Assessment photo endpoints
  app.post(
    "/api/assessment-photos",
    isAuthenticated,
    upload.single("photo"),
    async (req: any, res) => {
      try {
        if (!req.file) {
          return res.status(400).json({ message: "Nenhuma foto enviada" });
        }

        const photoData = {
          assessmentId: req.body.assessmentId,
          studentId: req.body.studentId,
          photoType: req.body.photoType,
          photoUrl: `/uploads/assessment-photos/${req.file.filename}`,
          fileName: req.file.filename,
          fileSize: req.file.size,
          mimeType: req.file.mimetype,
        };

        // Validate required fields
        const validationResult =
          insertAssessmentPhotoSchema.safeParse(photoData);
        if (!validationResult.success) {
          // Remove uploaded file if validation fails
          await fs.unlink(req.file.path).catch(() => {});
          return res.status(400).json({
            message: "Dados inválidos",
            errors: validationResult.error.errors,
          });
        }

        const photo = await storage.createAssessmentPhoto(
          validationResult.data
        );
        res.status(201).json(photo);
      } catch (error) {
        console.error("Error uploading photo:", error);
        // Clean up uploaded file on error
        if (req.file) {
          await fs.unlink(req.file.path).catch(() => {});
        }
        res.status(500).json({ message: "Falha ao fazer upload da foto" });
      }
    }
  );

  app.get(
    "/api/assessment-photos/:assessmentId",
    isAuthenticated,
    async (req: any, res) => {
      try {
        const assessmentId = req.params.assessmentId;
        const photos = await storage.getAssessmentPhotos(assessmentId);
        res.json(photos);
      } catch (error) {
        console.error("Error fetching assessment photos:", error);
        res.status(500).json({ message: "Falha ao buscar fotos" });
      }
    }
  );

  app.delete(
    "/api/assessment-photos/:photoId",
    isAuthenticated,
    async (req: any, res) => {
      try {
        const photoId = req.params.photoId;

        // Get photo info before deleting
        const photo = await storage.getAssessmentPhoto(photoId);
        if (!photo) {
          return res.status(404).json({ message: "Foto não encontrada" });
        }

        // Delete from database
        await storage.deleteAssessmentPhoto(photoId);

        // Delete physical file
        const filePath = path.join(
          process.cwd(),
          "uploads",
          "assessment-photos",
          photo.fileName
        );
        await fs.unlink(filePath).catch(() => {
          // File might not exist, log but don't fail
          console.warn(`Arquivo não encontrado: ${filePath}`);
        });

        res.status(204).send();
      } catch (error) {
        console.error("Error deleting photo:", error);
        res.status(500).json({ message: "Falha ao deletar foto" });
      }
    }
  );

  // Serve uploaded photos statically
  app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));

  // Create HTTP server (don't start listening here)
  const httpServer = createServer(app);
  return httpServer;
}
