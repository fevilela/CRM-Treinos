import express, { type Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { registerCalendarRoutes } from "./calendar-routes";
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
  insertUserSchema,
  insertCalendarEventSchema,
  insertFinancialAccountSchema,
  insertPaymentSchema,
  type Student,
  type CalendarEvent,
  type InsertCalendarEvent,
  type FinancialAccount,
  type Payment,
} from "@shared/schema";
import { z } from "zod";
import multer from "multer";
import { promises as fs } from "fs";
import path from "path";
import crypto from "crypto";
// Blueprint: replitmail integration
import {
  sendAllEventNotifications,
  getUpcomingEventsForNotification,
} from "./notification-service";
import { getSchedulerStatus } from "./notification-scheduler";

// Helper function to sanitize student objects by removing sensitive fields
function sanitizeStudent(
  student: Student
): Omit<Student, "password" | "inviteToken"> {
  const { password, inviteToken, ...sanitizedStudent } = student;
  return sanitizedStudent;
}

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

  // Debug route for development
  if (process.env.NODE_ENV === "development") {
    app.get("/api/debug/session", (req: any, res) => {
      res.json({
        sessionID: req.sessionID,
        user: req.user || null,
        isAuthenticated: req.isAuthenticated(),
        sessionData: req.session || null,
        cookies: req.headers.cookie || null,
      });
    });
  }

  // Student auth route - get current student data
  app.get("/api/auth/student/me", isAuthenticated, async (req: any, res) => {
    try {
      if (req.user.role !== "student") {
        return res.status(403).json({ message: "Access denied" });
      }

      // Look up student by email since user ID and student ID are different
      const student = await storage.getStudentByEmail(req.user.email);
      if (!student) {
        return res.status(404).json({
          success: false,
          message: "Student record not found",
        });
      }

      res.json({ success: true, student: sanitizeStudent(student) });
    } catch (error) {
      console.error("Error fetching student data:", error);
      res.status(500).json({
        success: false,
        message: "Failed to fetch student data",
      });
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
      res.json(students.map(sanitizeStudent));
    } catch (error) {
      console.error("Error fetching students:", error);
      res.status(500).json({ message: "Failed to fetch students" });
    }
  });

  app.get("/api/students/:id", isAuthenticated, async (req: any, res) => {
    try {
      const student = await storage.getStudent(req.params.id);
      if (!student) {
        return res.status(404).json({ message: "Student not found" });
      }

      // Verificar autorização: professor deve ser dono do aluno OU o próprio aluno acessando
      if (
        req.user.role === "teacher" &&
        student.personalTrainerId !== req.user.id
      ) {
        return res
          .status(403)
          .json({ message: "Você não tem permissão para este aluno" });
      } else if (req.user.role === "student" && student.id !== req.user.id) {
        return res
          .status(403)
          .json({ message: "Você só pode acessar seus próprios dados" });
      }

      res.json(sanitizeStudent(student));
    } catch (error) {
      console.error("Error fetching student:", error);
      res.status(500).json({ message: "Failed to fetch student" });
    }
  });

  app.post("/api/students", isTeacher, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const { sendInviteEmail, ...studentData } = req.body;

      // Gerar token de convite único
      const inviteToken = crypto.randomUUID();

      const validatedData = insertStudentSchema.parse({
        ...studentData,
        personalTrainerId: userId,
        inviteToken: inviteToken,
        isInvitePending: true, // Aluno deve configurar senha via convite
        password: null, // Será definida via convite
      });

      const student = await storage.createStudent(validatedData);

      // Enviar email de convite se solicitado
      if (sendInviteEmail && student.email) {
        try {
          const teacher = await storage.getUser(userId);
          const { generateInviteEmail, sendEmail } = await import("./email");
          const { subject, html } = generateInviteEmail(
            student.name,
            inviteToken,
            teacher?.firstName || "Seu Personal Trainer"
          );

          await sendEmail({
            to: student.email,
            from: process.env.GMAIL_USER || "noreply@crmtreinos.com",
            subject,
            html,
          });

          console.log(`Convite enviado para: ${student.email}`);
        } catch (emailError) {
          console.error("Erro ao enviar email de convite:", emailError);
          // Não falha a criação do aluno se o email falhar
        }
      }

      res.json(sanitizeStudent(student));
    } catch (error) {
      console.error("Error creating student:", error);
      res.status(500).json({ message: "Failed to create student" });
    }
  });

  app.put("/api/students/:id", isTeacher, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const studentId = req.params.id;

      // Verificar se o professor é dono do aluno antes de atualizar
      const existingStudent = await storage.getStudent(studentId);
      if (!existingStudent) {
        return res.status(404).json({ message: "Student not found" });
      }

      if (existingStudent.personalTrainerId !== userId) {
        return res
          .status(403)
          .json({ message: "Você não tem permissão para este aluno" });
      }

      const validatedData = insertStudentSchema.partial().parse(req.body);
      const student = await storage.updateStudent(studentId, validatedData);
      res.json(sanitizeStudent(student));
    } catch (error) {
      console.error("Error updating student:", error);
      res.status(500).json({ message: "Failed to update student" });
    }
  });

  app.delete("/api/students/:id", isTeacher, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const studentId = req.params.id;

      // Verificar se o professor é dono do aluno antes de deletar
      const existingStudent = await storage.getStudent(studentId);
      if (!existingStudent) {
        return res.status(404).json({ message: "Student not found" });
      }

      if (existingStudent.personalTrainerId !== userId) {
        return res
          .status(403)
          .json({ message: "Você não tem permissão para este aluno" });
      }

      await storage.deleteStudent(studentId);
      res.json({ message: "Student deleted successfully" });
    } catch (error) {
      console.error("Error deleting student:", error);
      res.status(500).json({ message: "Failed to delete student" });
    }
  });

  // Rota para reenviar convite de aluno
  app.post(
    "/api/students/:id/resend-invite",
    isTeacher,
    async (req: any, res) => {
      try {
        const userId = req.user.id;
        const studentId = req.params.id;

        const student = await storage.getStudent(studentId);
        if (!student) {
          return res.status(404).json({ message: "Aluno não encontrado" });
        }

        // Verificar se o professor é dono do aluno (CRÍTICO para segurança)
        if (student.personalTrainerId !== userId) {
          return res
            .status(403)
            .json({ message: "Você não tem permissão para este aluno" });
        }

        if (!student.email) {
          return res
            .status(400)
            .json({ message: "Aluno não tem email cadastrado" });
        }

        if (!student.isInvitePending) {
          return res.status(400).json({ message: "Aluno já ativou sua conta" });
        }

        // Sempre gerar novo token para segurança (rotação de token)
        const inviteToken = crypto.randomUUID();
        await storage.updateStudent(studentId, {
          inviteToken: inviteToken,
          isInvitePending: true,
        });

        try {
          const teacher = await storage.getUser(userId);
          const { generateInviteEmail, sendEmail } = await import("./email");
          const { subject, html } = generateInviteEmail(
            student.name,
            inviteToken,
            teacher?.firstName || "Seu Personal Trainer"
          );

          await sendEmail({
            to: student.email,
            from: process.env.GMAIL_USER || "noreply@crmtreinos.com",
            subject,
            html,
          });

          res.json({
            success: true,
            message: `Convite reenviado para ${student.email}`,
          });
        } catch (emailError) {
          console.error("Erro ao reenviar email de convite:", emailError);
          res.status(500).json({ message: "Erro ao enviar email de convite" });
        }
      } catch (error) {
        console.error("Error resending invite:", error);
        res.status(500).json({ message: "Failed to resend invite" });
      }
    }
  );

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

  app.get("/api/workouts/:id", isStudentOrTeacher, async (req: any, res) => {
    try {
      const workout = await storage.getWorkout(req.params.id);
      if (!workout) {
        return res.status(404).json({ message: "Workout not found" });
      }

      // Verificar autorização: aluno só vê seus treinos, professor só vê treinos que criou
      const user = req.user;
      if (user.role === "student") {
        // Para alunos, buscar o studentId pelo email
        const student = await storage.getStudentByEmail(user.email);
        if (!student || workout.studentId !== student.id) {
          return res
            .status(403)
            .json({ message: "Access denied to this workout" });
        }
      }
      if (user.role === "teacher" && workout.personalTrainerId !== user.id) {
        return res
          .status(403)
          .json({ message: "Access denied to this workout" });
      }

      const exercises = await storage.getWorkoutExercises(req.params.id);
      res.json({ ...workout, exercises });
    } catch (error) {
      console.error("Error fetching workout:", error);
      res.status(500).json({ message: "Failed to fetch workout" });
    }
  });

  // Endpoint específico para buscar exercícios de um treino
  app.get(
    "/api/exercises/:workoutId",
    isStudentOrTeacher,
    async (req: any, res) => {
      try {
        // Primeiro verificar se o workout existe e se o usuário tem acesso
        const workout = await storage.getWorkout(req.params.workoutId);
        if (!workout) {
          return res.status(404).json({ message: "Workout not found" });
        }

        // Verificar autorização: aluno só vê exercícios dos seus treinos
        const user = req.user;
        if (user.role === "student") {
          // Para alunos, buscar o studentId pelo email
          const student = await storage.getStudentByEmail(user.email);
          if (!student || workout.studentId !== student.id) {
            return res
              .status(403)
              .json({ message: "Access denied to this workout" });
          }
        }
        if (user.role === "teacher" && workout.personalTrainerId !== user.id) {
          return res
            .status(403)
            .json({ message: "Access denied to this workout" });
        }

        const exercises = await storage.getWorkoutExercises(
          req.params.workoutId
        );
        res.json(exercises);
      } catch (error) {
        console.error("Error fetching workout exercises:", error);
        res.status(500).json({ message: "Failed to fetch workout exercises" });
      }
    }
  );

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
    async (req: any, res) => {
      try {
        const { studentId } = req.params;
        const user = req.user;

        // Verificar autorização
        if (user.role === "student") {
          // Aluno só pode ver seus próprios treinos
          const student = await storage.getStudentByEmail(user.email);
          if (!student || student.id !== studentId) {
            return res
              .status(403)
              .json({ message: "Access denied to student workouts" });
          }
        } else if (user.role === "teacher") {
          // Professor só pode ver treinos de alunos que ele treina
          const student = await storage.getStudent(studentId);
          if (!student || student.personalTrainerId !== user.id) {
            return res
              .status(403)
              .json({ message: "Access denied to student workouts" });
          }
        }

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

  // Get workout sessions for specific student
  app.get(
    "/api/workout-sessions/student/:studentId",
    isStudentOrTeacher,
    async (req, res) => {
      try {
        const { studentId } = req.params;
        const sessions = await storage.getWorkoutSessions(studentId);
        res.json(sessions);
      } catch (error) {
        console.error("Error fetching student workout sessions:", error);
        res
          .status(500)
          .json({ message: "Failed to fetch student workout sessions" });
      }
    }
  );

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
        // Create a session for the student by creating a temporary user object
        const studentUser = {
          id: student.id,
          email: student.email,
          firstName: student.name.split(" ")[0],
          lastName: student.name.split(" ").slice(1).join(" ") || "",
          role: "student" as const,
          personalTrainerId: student.personalTrainerId, // This marks it as from students table
        };

        // Log the student in using passport session
        req.login(studentUser, (err) => {
          if (err) {
            return res.status(500).json({ message: "Erro ao criar sessão" });
          }
          res.json({ success: true, student: sanitizeStudent(student) });
        });
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
        student: sanitizeStudent(updatedStudent),
      });
    } catch (error) {
      console.error("Error setting up password:", error);
      res.status(500).json({ message: "Failed to setup password" });
    }
  });

  // Primeiro acesso do aluno - verificar email e enviar código
  app.post("/api/auth/student/first-access", async (req, res) => {
    try {
      const { email } = req.body;

      if (!email) {
        return res.status(400).json({ message: "Email é obrigatório" });
      }

      // Buscar aluno pelo email
      const student = await storage.getStudentByEmail(email);

      // Normalizar resposta para evitar enumeração de usuários
      // Sempre retornar sucesso, mesmo se email não existe ou já está ativo
      if (!student || !student.isInvitePending) {
        // Retornar sucesso mesmo quando email não existe para evitar enumeração
        return res.json({
          success: true,
          message:
            "Se o email estiver cadastrado e pendente de primeiro acesso, você receberá um código de verificação.",
        });
      }

      // Gerar código de verificação
      const {
        generateVerificationCode,
        hashVerificationCode,
        generateVerificationEmail,
        sendEmail,
      } = await import("./email-independent");
      const verificationCode = await generateVerificationCode();
      const hashedCode = await hashVerificationCode(verificationCode);
      const codeExpiry = new Date(Date.now() + 15 * 60 * 1000); // 15 minutos

      // Salvar código hasheado no banco
      await storage.updateStudent(student.id, {
        verificationCode: hashedCode,
        verificationCodeExpiry: codeExpiry,
      });

      // Enviar email com código
      const { subject, html } = generateVerificationEmail(
        student.name,
        verificationCode
      );
      const emailSent = await sendEmail({
        to: email,
        subject,
        html,
      });

      if (emailSent) {
        res.json({
          success: true,
          message: "Código de verificação enviado para seu email",
        });
      } else {
        res.status(500).json({
          success: false,
          message: "Erro ao enviar email. Tente novamente.",
        });
      }
    } catch (error) {
      console.error("Error in first access:", error);
      res.status(500).json({
        success: false,
        message: "Erro interno do servidor",
      });
    }
  });

  // Verificar código e criar senha
  app.post("/api/auth/student/verify-and-create-password", async (req, res) => {
    try {
      const { email, code, password } = req.body;

      if (!email || !code || !password) {
        return res.status(400).json({
          success: false,
          message: "Email, código e senha são obrigatórios",
        });
      }

      // Buscar aluno pelo email
      const student = await storage.getStudentByEmail(email);
      if (!student) {
        return res.status(404).json({
          success: false,
          message: "Aluno não encontrado",
        });
      }

      // Verificar se código não expirou PRIMEIRO
      if (
        !student.verificationCodeExpiry ||
        new Date() > student.verificationCodeExpiry
      ) {
        return res.status(400).json({
          success: false,
          message: "Código de verificação expirado. Solicite um novo código.",
        });
      }

      // Verificar código de verificação
      const { verifyCode } = await import("./email-independent");
      if (
        !student.verificationCode ||
        !(await verifyCode(code, student.verificationCode))
      ) {
        return res.status(400).json({
          success: false,
          message: "Código de verificação inválido",
        });
      }

      // Criar hash da senha
      const bcrypt = await import("bcryptjs");
      const hashedPassword = await bcrypt.hash(password, 10);

      // Atualizar senha e marcar como ativo, limpando campos de verificação
      await storage.updateStudent(student.id, {
        password: hashedPassword,
        isInvitePending: false,
        verificationCode: null, // Limpar código usado
        verificationCodeExpiry: null,
        inviteToken: null, // Limpar token se houver
      });

      // Fazer login automático após criar senha
      const updatedStudent = await storage.getStudent(student.id);
      res.json({
        success: true,
        message: "Senha criada com sucesso",
        student: updatedStudent,
      });
    } catch (error) {
      console.error("Error in verify and create password:", error);
      res.status(500).json({
        success: false,
        message: "Erro interno do servidor",
      });
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

  // Rota para rastrear mudanças de peso quando série é completada
  app.post(
    "/api/exercise-weight-change",
    isStudentOrTeacher,
    async (req, res) => {
      try {
        const {
          studentId,
          exerciseId,
          exerciseName,
          sets,
          reps,
          currentWeight,
          workoutSessionId,
          comments,
        } = req.body;

        // Buscar o peso anterior do mesmo exercício
        const previousHistory = await storage.getExerciseProgress(
          studentId,
          exerciseId
        );
        const previousWeight =
          previousHistory.length > 0
            ? parseFloat(previousHistory[0].weight)
            : null;

        const currentWeightFloat = parseFloat(currentWeight);

        // Calcular tipo de mudança e porcentagem
        let changeType: "increase" | "decrease" | "maintain" = "maintain";
        let percentageChange = 0;

        if (previousWeight && currentWeightFloat !== previousWeight) {
          if (currentWeightFloat > previousWeight) {
            changeType = "increase";
          } else if (currentWeightFloat < previousWeight) {
            changeType = "decrease";
          }

          // Calcular porcentagem da mudança
          percentageChange =
            ((currentWeightFloat - previousWeight) / previousWeight) * 100;
        }

        // Salvar no histórico com comparação
        const historyData = {
          studentId,
          exerciseId,
          exerciseName,
          sets: parseInt(sets),
          reps: reps.toString(),
          weight: currentWeight.toString(),
          previousWeight: previousWeight ? previousWeight.toString() : null,
          changeType,
          percentageChange: percentageChange.toString(),
          comments,
          workoutSessionId,
        };

        const validatedData = insertWorkoutHistorySchema.parse(historyData);
        const history = await storage.createWorkoutHistory(validatedData);

        // Retornar com informações da mudança para a interface
        res.json({
          ...history,
          hasChange: previousWeight !== null,
          changeSymbol:
            changeType === "increase"
              ? "↑"
              : changeType === "decrease"
              ? "↓"
              : "→",
          changeColor:
            changeType === "increase"
              ? "green"
              : changeType === "decrease"
              ? "red"
              : "gray",
        });
      } catch (error) {
        console.error("Error tracking weight change:", error);
        res.status(500).json({ message: "Failed to track weight change" });
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

  // Rota para obter o student record do usuário autenticado
  app.get("/api/student/me", isAuthenticated, async (req: any, res) => {
    try {
      const user = req.user;

      if (user.role !== "student") {
        return res.status(403).json({
          message: "Access denied. Only students can access this endpoint.",
        });
      }

      // Busca o student record baseado no email do usuário autenticado
      const student = await storage.getStudentByEmail(user.email);
      if (!student) {
        return res.status(404).json({
          message: "Student record not found. Please contact your trainer.",
        });
      }

      res.json(sanitizeStudent(student));
    } catch (error) {
      console.error("Error fetching student record:", error);
      res.status(500).json({ message: "Failed to fetch student record" });
    }
  });

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

  // Secure endpoint for students and teachers to get their own assessments
  app.get(
    "/api/physical-assessments/me",
    isAuthenticated,
    async (req: any, res) => {
      try {
        const user = req.user;

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
    console.log("🔄 PUT /api/physical-assessments/:id - Requisição recebida");
    console.log("📝 Assessment ID:", req.params.id);
    console.log("👤 User ID:", req.user?.id);

    try {
      const assessmentId = req.params.id;

      // Verify assessment exists and belongs to the teacher
      const existingAssessment = await storage.getPhysicalAssessment(
        assessmentId
      );
      if (!existingAssessment) {
        console.log("❌ Avaliação não encontrada:", assessmentId);
        return res
          .status(404)
          .json({ message: "Physical assessment not found" });
      }

      if (existingAssessment.personalTrainerId !== req.user.id) {
        console.log("❌ Acesso negado - Personal trainer não autorizado");
        return res.status(403).json({ message: "Access denied" });
      }

      // Remove personalTrainerId from body to prevent changes
      const { personalTrainerId, ...updateData } = req.body;
      console.log("📊 Dados para atualização:", Object.keys(updateData));

      const validatedData = insertPhysicalAssessmentSchema
        .partial()
        .parse(updateData);

      console.log(
        "✅ Dados validados, chamando storage.updatePhysicalAssessment..."
      );
      const assessment = await storage.updatePhysicalAssessment(
        assessmentId,
        validatedData
      );

      console.log("🎉 Avaliação atualizada com sucesso!");
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

  // Configure multer for video uploads
  const videoUploadsDir = path.join(
    process.cwd(),
    "uploads",
    "exercise-videos"
  );

  // Ensure video uploads directory exists
  await fs.mkdir(videoUploadsDir, { recursive: true });

  const videoStorage = multer.diskStorage({
    destination: videoUploadsDir,
    filename: (req, file, cb) => {
      const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
      const ext = path.extname(file.originalname);
      cb(null, `video-${uniqueSuffix}${ext}`);
    },
  });

  const uploadVideo = multer({
    storage: videoStorage,
    limits: {
      fileSize: 100 * 1024 * 1024, // 100MB limit for videos
    },
    fileFilter: (req, file, cb) => {
      const allowedTypes = [
        "video/mp4",
        "video/mpeg",
        "video/quicktime",
        "video/webm",
        "video/ogg",
      ];
      if (!allowedTypes.includes(file.mimetype)) {
        return cb(
          new Error(
            "Apenas arquivos de vídeo são permitidos (MP4, MPEG, MOV, WebM, OGG)"
          )
        );
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

  // Video upload endpoint for exercises
  app.post(
    "/api/exercise-videos",
    isTeacher,
    uploadVideo.single("video"),
    async (req: any, res) => {
      try {
        if (!req.file) {
          return res.status(400).json({ message: "Nenhum vídeo enviado" });
        }

        const videoUrl = `/uploads/exercise-videos/${req.file.filename}`;

        res.status(201).json({
          videoUrl,
          fileName: req.file.filename,
          fileSize: req.file.size,
          mimeType: req.file.mimetype,
        });
      } catch (error) {
        console.error("Error uploading video:", error);
        // Clean up uploaded file on error
        if (req.file) {
          await fs.unlink(req.file.path).catch(() => {});
        }
        res.status(500).json({ message: "Falha ao fazer upload do vídeo" });
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

  // Generate PDF analysis for assessment
  app.get(
    "/api/physical-assessments/:id/analysis-pdf",
    isAuthenticated,
    async (req: any, res) => {
      console.log("📄 Gerando PDF de análise para avaliação:", req.params.id);

      try {
        const assessmentId = req.params.id;

        // Get current assessment
        const currentAssessment = await storage.getPhysicalAssessment(
          assessmentId
        );
        if (!currentAssessment) {
          console.log("❌ Avaliação não encontrada:", assessmentId);
          return res.status(404).json({ message: "Assessment not found" });
        }

        // Check authorization - allow both personal trainer and student to access
        const isPersonalTrainer =
          currentAssessment.personalTrainerId === req.user.id;
        const isStudent = currentAssessment.studentId === req.user.id;

        if (!isPersonalTrainer && !isStudent) {
          console.log("❌ Acesso negado - Usuário não autorizado");
          return res.status(403).json({ message: "Access denied" });
        }

        console.log(
          `✅ Acesso autorizado - ${
            isPersonalTrainer ? "Personal trainer" : "Aluno"
          }`
        );

        // Get previous assessment version for comparison
        const history = await storage.getPhysicalAssessmentHistory(
          assessmentId
        );
        const previousAssessment = history.length > 0 ? history[0] : undefined;

        console.log(
          `📊 Comparando com versão anterior: ${
            previousAssessment
              ? `Versão ${previousAssessment.versionNumber}`
              : "Primeira avaliação"
          }`
        );

        // Generate PDF
        const pdfBuffer = await storage.generateProgressAnalysisPDF(
          currentAssessment,
          previousAssessment
        );

        // Get student info for filename
        const student = await storage.getStudent(currentAssessment.studentId);
        const studentName =
          student?.name.replace(/[^a-zA-Z0-9]/g, "_") || "aluno";
        const date = new Date().toISOString().split("T")[0];
        const filename = `analise_progresso_${studentName}_${date}.pdf`;

        console.log("✅ PDF gerado com sucesso:", filename);

        // Set response headers
        res.setHeader("Content-Type", "application/pdf");
        res.setHeader(
          "Content-Disposition",
          `attachment; filename="${filename}"`
        );
        res.setHeader("Content-Length", pdfBuffer.length);

        // Send PDF
        res.send(pdfBuffer);
      } catch (error) {
        console.error("Error generating PDF:", error);
        res.status(500).json({ message: "Falha ao gerar PDF de análise" });
      }
    }
  );

  // Profile image upload configuration
  const profileUploadsDir = path.join(
    process.cwd(),
    "uploads",
    "profile-images"
  );
  await fs.mkdir(profileUploadsDir, { recursive: true });

  const profileImageStorage = multer.diskStorage({
    destination: profileUploadsDir,
    filename: (req, file, cb) => {
      const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
      const ext = path.extname(file.originalname);
      cb(null, `profile-${uniqueSuffix}${ext}`);
    },
  });

  const uploadProfileImage = multer({
    storage: profileImageStorage,
    limits: {
      fileSize: 5 * 1024 * 1024, // 5MB limit for profile images
    },
    fileFilter: (req, file, cb) => {
      const allowedTypes = [
        "image/jpeg",
        "image/jpg",
        "image/png",
        "image/webp",
      ];
      if (!allowedTypes.includes(file.mimetype)) {
        return cb(
          new Error(
            "Apenas arquivos de imagem são permitidos (JPEG, PNG, WebP)"
          )
        );
      }
      cb(null, true);
    },
  });

  // Teacher profile update validation schema
  const teacherProfileUpdateSchema = z.object({
    firstName: z.string().min(1).optional(),
    lastName: z.string().min(1).optional(),
    email: z.string().email().optional(),
    phone: z.string().optional(),
    dateOfBirth: z.coerce.date().optional(),
    crefNumber: z.string().optional(),
    crefExpiryDate: z.coerce.date().optional(),
    profileImageUrl: z.string().optional(),
  });

  // Teacher profile update route
  app.put(
    "/api/profile/teacher",
    isAuthenticated,
    uploadProfileImage.single("profileImage"),
    async (req: any, res) => {
      try {
        const userId = req.user.id;

        // Verify user is a teacher
        if (req.user.role !== "teacher") {
          return res.status(403).json({
            message:
              "Acesso negado. Apenas professores podem atualizar este perfil.",
          });
        }

        // Validate input data
        const validationResult = teacherProfileUpdateSchema.safeParse(req.body);
        if (!validationResult.success) {
          // Clean up uploaded file if validation fails
          if (req.file) {
            await fs.unlink(req.file.path).catch(() => {});
          }
          return res.status(400).json({
            message: "Dados inválidos",
            errors: validationResult.error.errors,
          });
        }

        const updateData = validationResult.data;

        // Handle profile image upload
        if (req.file) {
          updateData.profileImageUrl = `/uploads/profile-images/${req.file.filename}`;
        }

        // Update user in database
        await storage.updateUser(userId, updateData);

        // Return success without sensitive data - frontend will refetch user data
        res.json({
          success: true,
          message: "Perfil atualizado com sucesso",
        });
      } catch (error) {
        console.error("Error updating teacher profile:", error);
        // Clean up uploaded file on error
        if (req.file) {
          await fs.unlink(req.file.path).catch(() => {});
        }
        res.status(500).json({ message: "Falha ao atualizar perfil" });
      }
    }
  );

  // Student profile update validation schema (disallow email changes to prevent identity issues)
  const studentProfileUpdateSchema = z.object({
    name: z.string().min(1).optional(),
    phone: z.string().optional(),
    dateOfBirth: z.coerce.date().optional(),
    gender: z.enum(["male", "female"]).optional(),
    weight: z.coerce.number().positive().optional(),
    height: z.coerce.number().positive().optional(),
    goal: z.string().optional(),
    medicalConditions: z.string().optional(),
    profileImage: z.string().optional(),
  });

  // Student profile update route
  app.put(
    "/api/profile/student",
    isAuthenticated,
    uploadProfileImage.single("profileImage"),
    async (req: any, res) => {
      try {
        const user = req.user;

        // Verify user is a student
        if (user.role !== "student") {
          return res.status(403).json({
            message:
              "Acesso negado. Apenas alunos podem atualizar este perfil.",
          });
        }

        // Get student record
        const student = await storage.getStudentByEmail(user.email);
        if (!student) {
          return res
            .status(404)
            .json({ message: "Registro de aluno não encontrado" });
        }

        // Validate input data
        const validationResult = studentProfileUpdateSchema.safeParse(req.body);
        if (!validationResult.success) {
          // Clean up uploaded file if validation fails
          if (req.file) {
            await fs.unlink(req.file.path).catch(() => {});
          }
          return res.status(400).json({
            message: "Dados inválidos",
            errors: validationResult.error.errors,
          });
        }

        const updateData = validationResult.data;

        // Handle profile image upload
        if (req.file) {
          updateData.profileImage = `/uploads/profile-images/${req.file.filename}`;
        }

        // Update student in database
        await storage.updateStudent(student.id, updateData);

        // Return success without sensitive data - frontend will refetch student data
        res.json({
          success: true,
          message: "Perfil atualizado com sucesso",
        });
      } catch (error) {
        console.error("Error updating student profile:", error);
        // Clean up uploaded file on error
        if (req.file) {
          await fs.unlink(req.file.path).catch(() => {});
        }
        res.status(500).json({ message: "Falha ao atualizar perfil" });
      }
    }
  );

  // Serve uploaded photos statically
  app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));

  // Register calendar routes
  registerCalendarRoutes(app);

  // Calendar events routes - apenas para professores
  app.get("/api/calendar/events", isTeacher, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const events = await storage.getCalendarEvents(userId);
      res.json(events);
    } catch (error) {
      console.error("Error fetching calendar events:", error);
      res.status(500).json({ message: "Failed to fetch calendar events" });
    }
  });

  // Get events for a specific student
  app.get(
    "/api/calendar/events/student/:studentId",
    isAuthenticated,
    async (req: any, res) => {
      try {
        const { studentId } = req.params;

        // Verify student belongs to this teacher or is the student themselves
        const student = await storage.getStudent(studentId);
        if (!student) {
          return res.status(404).json({ message: "Student not found" });
        }

        if (req.user.role === "teacher") {
          // Teacher must own this student
          if (student.personalTrainerId !== req.user.id) {
            return res.status(403).json({ message: "Access denied" });
          }
        } else if (req.user.role === "student") {
          // Student must be viewing their own events - get student record by email
          const authenticatedStudent = await storage.getStudentByEmail(
            req.user.email
          );
          if (!authenticatedStudent || authenticatedStudent.id !== studentId) {
            return res.status(403).json({ message: "Access denied" });
          }
        } else {
          return res.status(403).json({ message: "Access denied" });
        }

        const events = await storage.getStudentCalendarEvents(studentId);
        res.json(events);
      } catch (error) {
        console.error("Error fetching student calendar events:", error);
        res
          .status(500)
          .json({ message: "Failed to fetch student calendar events" });
      }
    }
  );

  // Create calendar event
  app.post("/api/calendar/events", isTeacher, async (req: any, res) => {
    try {
      const userId = req.user.id;

      // Debug: Log incoming data
      console.log(
        "[DEBUG] Incoming request body:",
        JSON.stringify(req.body, null, 2)
      );
      console.log("[DEBUG] User ID:", userId);

      const dataToValidate = {
        ...req.body,
        personalTrainerId: userId,
      };

      console.log(
        "[DEBUG] Data to validate:",
        JSON.stringify(dataToValidate, null, 2)
      );

      const validatedData = insertCalendarEventSchema.parse(dataToValidate);

      // If studentId is provided, verify student belongs to this teacher
      if (validatedData.studentId) {
        const student = await storage.getStudent(validatedData.studentId);
        if (!student || student.personalTrainerId !== userId) {
          return res.status(400).json({ message: "Invalid student" });
        }
      }

      const event = await storage.createCalendarEvent(validatedData);
      res.status(201).json(event);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          message: "Invalid input",
          errors: error.errors,
        });
      }
      console.error("Error creating calendar event:", error);
      res.status(500).json({ message: "Failed to create calendar event" });
    }
  });

  // Update calendar event
  app.put("/api/calendar/events/:id", isTeacher, async (req: any, res) => {
    try {
      const { id } = req.params;
      const userId = req.user.id;

      // Verify event belongs to this teacher
      const existingEvent = await storage.getCalendarEvent(id);
      if (!existingEvent) {
        return res.status(404).json({ message: "Event not found" });
      }

      if (existingEvent.personalTrainerId !== userId) {
        return res.status(403).json({ message: "Access denied" });
      }

      const validatedData = insertCalendarEventSchema.partial().parse(req.body);

      // Remove any attempt to change ownership - prevent privilege escalation
      delete validatedData.personalTrainerId;

      // If studentId is being updated, verify student belongs to this teacher
      if (validatedData.studentId !== undefined) {
        if (validatedData.studentId) {
          const student = await storage.getStudent(validatedData.studentId);
          if (!student || student.personalTrainerId !== userId) {
            return res.status(400).json({ message: "Invalid student" });
          }
        }
        // Allow setting studentId to null (personal events)
      }

      const event = await storage.updateCalendarEvent(id, validatedData);
      res.json(event);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          message: "Invalid input",
          errors: error.errors,
        });
      }
      console.error("Error updating calendar event:", error);
      res.status(500).json({ message: "Failed to update calendar event" });
    }
  });

  // Delete calendar event
  app.delete(
    "/api/calendar/events/:id",
    isAuthenticated,
    async (req: any, res) => {
      try {
        const { id } = req.params;
        const userId = req.user.id;

        // Verify event belongs to this teacher
        const existingEvent = await storage.getCalendarEvent(id);
        if (!existingEvent) {
          return res.status(404).json({ message: "Event not found" });
        }

        if (existingEvent.personalTrainerId !== userId) {
          return res.status(403).json({ message: "Access denied" });
        }

        await storage.deleteCalendarEvent(id);
        res.status(204).send();
      } catch (error) {
        console.error("Error deleting calendar event:", error);
        res.status(500).json({ message: "Failed to delete calendar event" });
      }
    }
  );

  // Notification routes - Blueprint: replitmail integration

  // Send event notifications (manual trigger for testing)
  app.post("/api/notifications/send", isTeacher, async (req: any, res) => {
    try {
      console.log(
        "[NOTIFICATION] Manual trigger started by user:",
        req.user.id
      );

      const result = await sendAllEventNotifications();

      res.json({
        message: "Notificações processadas com sucesso",
        ...result,
      });
    } catch (error) {
      console.error("Error sending notifications:", error);
      res.status(500).json({
        success: false,
        message: "Falha ao enviar notificações",
        error: error instanceof Error ? error.message : String(error),
      });
    }
  });

  // Get pending notifications preview
  app.get("/api/notifications/preview", isTeacher, async (req: any, res) => {
    try {
      const notifications = await getUpcomingEventsForNotification();

      res.json({
        success: true,
        count: notifications.length,
        notifications: notifications.map((n) => ({
          studentName: n.studentName,
          studentEmail: n.studentEmail,
          eventTitle: n.event.title,
          eventTime: n.event.startTime,
          eventType: n.event.type,
        })),
      });
    } catch (error) {
      console.error("Error getting notification preview:", error);
      res.status(500).json({
        success: false,
        message: "Falha ao buscar preview de notificações",
      });
    }
  });

  // Automated notification endpoint (for cron/scheduled tasks)
  app.post("/api/notifications/automated", async (req: any, res) => {
    try {
      // Security check with proper token validation - REQUIRES environment variable
      const expectedToken = process.env.NOTIFICATIONS_CRON_TOKEN;

      if (!expectedToken) {
        console.error("[NOTIFICATION] NOTIFICATIONS_CRON_TOKEN not configured");
        return res
          .status(500)
          .json({ message: "Notification service not configured" });
      }

      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        console.warn(
          "[NOTIFICATION] Invalid auth attempt from:",
          req.ip || "unknown"
        );
        return res
          .status(401)
          .json({ message: "Unauthorized - Missing Bearer token" });
      }

      const providedToken = authHeader.replace("Bearer ", "");

      // Use timing-safe comparison to prevent timing attacks
      const expectedBuffer = Buffer.from(expectedToken, "utf8");
      const providedBuffer = Buffer.from(providedToken, "utf8");

      if (expectedBuffer.length !== providedBuffer.length) {
        console.warn(
          "[NOTIFICATION] Invalid token length from:",
          req.ip || "unknown"
        );
        return res
          .status(401)
          .json({ message: "Unauthorized - Invalid token" });
      }

      const isValid = crypto.timingSafeEqual(expectedBuffer, providedBuffer);
      if (!isValid) {
        console.warn(
          "[NOTIFICATION] Invalid token attempt from:",
          req.ip || "unknown",
          "at:",
          new Date().toISOString()
        );
        return res
          .status(401)
          .json({ message: "Unauthorized - Invalid token" });
      }

      console.log(
        "[NOTIFICATION] Automated trigger started with valid credentials"
      );

      const result = await sendAllEventNotifications();

      res.json({
        message: "Automated notifications processed",
        timestamp: new Date().toISOString(),
        ...result,
      });
    } catch (error) {
      console.error("Error in automated notifications:", error);
      res.status(500).json({
        success: false,
        message: "Failed to process automated notifications",
        error: error instanceof Error ? error.message : String(error),
      });
    }
  });

  // Financial Management Routes

  // Get all financial accounts for a teacher
  app.get("/api/finances/accounts", isTeacher, async (req: any, res) => {
    try {
      const userId = req.user.id;

      // Validate query filters
      const filtersSchema = z.object({
        type: z.enum(["receivable", "payable"]).optional(),
        status: z
          .enum(["pending", "partial", "paid", "overdue", "cancelled"])
          .optional(),
        category: z
          .enum([
            "student_monthly",
            "student_assessment",
            "student_personal_training",
            "rent",
            "equipment",
            "marketing",
            "utilities",
            "insurance",
            "other",
          ])
          .optional(),
        studentId: z.string().uuid().optional(),
      });

      const filters = filtersSchema.parse(req.query);

      const accounts = await storage.getFinancialAccounts(userId, filters);

      res.json({ success: true, accounts });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          success: false,
          message: "Invalid query parameters",
          errors: error.errors,
        });
      }
      console.error("Error fetching financial accounts:", error);
      res.status(500).json({
        success: false,
        message: "Failed to fetch financial accounts",
      });
    }
  });

  // Get financial dashboard summary
  app.get("/api/finances/dashboard", isTeacher, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const summary = await storage.getFinancialDashboard(userId);
      res.json({ success: true, summary });
    } catch (error) {
      console.error("Error fetching financial dashboard:", error);
      res.status(500).json({
        success: false,
        message: "Failed to fetch financial dashboard",
      });
    }
  });

  // Get financial account by ID
  app.get("/api/finances/accounts/:id", isTeacher, async (req: any, res) => {
    try {
      const account = await storage.getFinancialAccount(req.params.id);
      if (!account) {
        return res.status(404).json({
          success: false,
          message: "Financial account not found",
        });
      }

      // Verify ownership
      if (account.personalTrainerId !== req.user.id) {
        return res.status(403).json({
          success: false,
          message: "Access denied",
        });
      }

      const payments = await storage.getPaymentsByAccountId(req.params.id);
      res.json({ success: true, account, payments });
    } catch (error) {
      console.error("Error fetching financial account:", error);
      res.status(500).json({
        success: false,
        message: "Failed to fetch financial account",
      });
    }
  });

  // Create new financial account
  app.post("/api/finances/accounts", isTeacher, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const validatedData = insertFinancialAccountSchema.parse({
        ...req.body,
        personalTrainerId: userId,
      });

      const account = await storage.createFinancialAccount(validatedData);
      res.status(201).json({ success: true, account });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          success: false,
          message: "Invalid data",
          errors: error.errors,
        });
      }
      console.error("Error creating financial account:", error);
      res.status(500).json({
        success: false,
        message: "Failed to create financial account",
      });
    }
  });

  // Update financial account
  app.put("/api/finances/accounts/:id", isTeacher, async (req: any, res) => {
    try {
      const accountId = req.params.id;
      const userId = req.user.id;

      // Verify ownership
      const existingAccount = await storage.getFinancialAccount(accountId);
      if (!existingAccount) {
        return res.status(404).json({
          success: false,
          message: "Financial account not found",
        });
      }

      if (existingAccount.personalTrainerId !== userId) {
        return res.status(403).json({
          success: false,
          message: "Access denied",
        });
      }

      // Whitelist only safe fields that can be updated
      const allowedFields = z.object({
        title: z.string().optional(),
        description: z.string().optional(),
        category: z
          .enum([
            "student_monthly",
            "student_assessment",
            "student_personal_training",
            "rent",
            "equipment",
            "marketing",
            "utilities",
            "insurance",
            "other",
          ])
          .optional(),
        amount: z.number().positive().optional(),
        dueDate: z
          .preprocess((val) => {
            if (typeof val === "string") {
              // Se vier em dd/MM/yyyy → converte para ISO
              const parts = val.split("/");
              if (parts.length === 3) {
                const [dd, mm, yyyy] = parts;
                const iso = `${yyyy}-${mm}-${dd}`;
                const parsed = new Date(iso);
                return isNaN(parsed.getTime()) ? undefined : parsed;
              }
              const parsed = new Date(val);
              return isNaN(parsed.getTime()) ? undefined : parsed;
            }
            if (val instanceof Date) return val;
            return undefined;
          }, z.date())
          .optional(),

        notes: z.string().optional(),
        isRecurring: z.boolean().optional(),
        recurringInterval: z.string().optional(),
        installments: z.number().int().positive().optional(),
      });

      const validatedData = allowedFields.parse(req.body);

      // If studentId is being changed, verify the student belongs to this teacher
      if (
        req.body.studentId &&
        req.body.studentId !== existingAccount.studentId
      ) {
        if (req.body.studentId) {
          const student = await storage.getStudent(req.body.studentId);
          if (!student || student.personalTrainerId !== userId) {
            return res.status(400).json({
              success: false,
              message:
                "Invalid student - student not found or not assigned to you",
            });
          }
          (validatedData as any).studentId = req.body.studentId;
        } else {
          (validatedData as any).studentId = null;
        }
      }

      if (validatedData.dueDate && typeof validatedData.dueDate === "string") {
        validatedData.dueDate = new Date(validatedData.dueDate);
      }

      const account = await storage.updateFinancialAccount(
        accountId,
        validatedData
      );

      res.json({ success: true, account });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          success: false,
          message: "Invalid data",
          errors: error.errors,
        });
      }
      console.error("Error updating financial account:", error);
      res.status(500).json({
        success: false,
        message: "Failed to update financial account",
      });
    }
  });

  // Delete financial account
  app.delete("/api/finances/accounts/:id", isTeacher, async (req: any, res) => {
    try {
      const accountId = req.params.id;
      const userId = req.user.id;

      // Verify ownership
      const existingAccount = await storage.getFinancialAccount(accountId);
      if (!existingAccount) {
        return res.status(404).json({
          success: false,
          message: "Financial account not found",
        });
      }

      if (existingAccount.personalTrainerId !== userId) {
        return res.status(403).json({
          success: false,
          message: "Access denied",
        });
      }

      await storage.deleteFinancialAccount(accountId);
      res.json({
        success: true,
        message: "Financial account deleted successfully",
      });
    } catch (error) {
      console.error("Error deleting financial account:", error);
      res.status(500).json({
        success: false,
        message: "Failed to delete financial account",
      });
    }
  });

  // Add payment to account
  app.post(
    "/api/finances/accounts/:id/payments",
    isTeacher,
    async (req: any, res) => {
      try {
        const accountId = req.params.id;
        const userId = req.user.id;

        // Verify account ownership
        const account = await storage.getFinancialAccount(accountId);
        if (!account) {
          return res.status(404).json({
            success: false,
            message: "Financial account not found",
          });
        }

        if (account.personalTrainerId !== userId) {
          return res.status(403).json({
            success: false,
            message: "Access denied",
          });
        }

        const validatedData = insertPaymentSchema.parse({
          ...req.body,
          accountId,
        });

        // Payment creation is now atomic and handles account updates internally
        const payment = await storage.createPayment(validatedData);

        // Get the updated account
        const updatedAccount = await storage.getFinancialAccount(accountId);

        res
          .status(201)
          .json({ success: true, payment, account: updatedAccount });
      } catch (error) {
        if (error instanceof z.ZodError) {
          return res.status(400).json({
            success: false,
            message: "Invalid data",
            errors: error.errors,
          });
        }

        // Handle specific business logic errors
        if (error instanceof Error) {
          if (error.message.includes("exceeds remaining balance")) {
            return res.status(400).json({
              success: false,
              message: error.message,
            });
          }
          if (error.message === "Payment amount must be positive") {
            return res.status(400).json({
              success: false,
              message: error.message,
            });
          }
        }

        console.error("Error creating payment:", error);
        res.status(500).json({
          success: false,
          message: "Failed to create payment",
        });
      }
    }
  );

  // Get student's own debts - for students to view their own debts
  app.get("/api/finances/my-debts", isAuthenticated, async (req: any, res) => {
    try {
      if (req.user.role !== "student") {
        return res.status(403).json({
          success: false,
          message: "Apenas alunos podem acessar suas próprias dívidas",
        });
      }

      // Look up student by email since user ID and student ID are different
      const student = await storage.getStudentByEmail(req.user.email);
      if (!student) {
        return res.status(404).json({
          success: false,
          message: "Registro de aluno não encontrado",
        });
      }

      // Get debt summary and detailed accounts
      const debtSummary = await storage.getStudentDebtSummary(student.id);
      const accounts = await storage.getFinancialAccounts(
        student.personalTrainerId,
        {
          type: "receivable",
          studentId: student.id,
        }
      );

      // Filter only unpaid/partial accounts
      const unpaidAccounts = accounts.filter(
        (account) =>
          account.status === "pending" ||
          account.status === "partial" ||
          account.status === "overdue"
      );

      res.json({
        success: true,
        summary: debtSummary,
        accounts: unpaidAccounts,
      });
    } catch (error) {
      console.error("Error fetching student debts:", error);
      res.status(500).json({
        success: false,
        message: "Erro ao buscar dívidas do aluno",
      });
    }
  });

  // Get overdue accounts for teacher
  app.get("/api/finances/overdue", isTeacher, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const overdueAccounts = await storage.getOverdueAccounts(userId);
      res.json({ success: true, accounts: overdueAccounts });
    } catch (error) {
      console.error("Error fetching overdue accounts:", error);
      res.status(500).json({
        success: false,
        message: "Failed to fetch overdue accounts",
      });
    }
  });

  // Get student debt summary
  app.get(
    "/api/finances/students/:studentId/debt",
    isTeacher,
    async (req: any, res) => {
      try {
        const userId = req.user.id;
        const studentId = req.params.studentId;

        // Verify student belongs to teacher
        const student = await storage.getStudent(studentId);
        if (!student || student.personalTrainerId !== userId) {
          return res.status(404).json({
            success: false,
            message: "Student not found",
          });
        }

        const debtSummary = await storage.getStudentDebtSummary(studentId);
        res.json({ success: true, debt: debtSummary });
      } catch (error) {
        console.error("Error fetching student debt:", error);
        res.status(500).json({
          success: false,
          message: "Failed to fetch student debt",
        });
      }
    }
  );

  // Get financial charts data
  app.get("/api/finances/charts", isTeacher, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const { period = "6months" } = req.query;

      const chartsData = await storage.getFinancialChartsData(
        userId,
        period as string
      );
      res.json({ success: true, data: chartsData });
    } catch (error) {
      console.error("Error fetching financial charts data:", error);
      res.status(500).json({
        success: false,
        message: "Failed to fetch financial charts data",
      });
    }
  });

  // Notification status endpoint
  app.get("/api/notifications/status", isTeacher, async (req: any, res) => {
    try {
      const status = getSchedulerStatus();

      res.json({
        success: true,
        scheduler: status,
        endpoints: {
          preview: "/api/notifications/preview",
          manual: "/api/notifications/send",
          automated: "/api/notifications/automated",
        },
        documentation: "See NOTIFICATION_SETUP.md for configuration details",
      });
    } catch (error) {
      console.error("Error getting notification status:", error);
      res.status(500).json({
        success: false,
        message: "Failed to get notification status",
      });
    }
  });

  // Student Payment Routes

  // Get student's charges/bills
  app.get("/api/student/charges", isStudentOrTeacher, async (req: any, res) => {
    try {
      let studentId = req.user.id;

      // If user is a teacher, they can specify studentId to view charges
      if (req.user.role === "teacher" && req.query.studentId) {
        // Verify the student belongs to this teacher
        const student = await storage.getStudent(req.query.studentId);
        if (!student || student.personalTrainerId !== req.user.id) {
          return res.status(403).json({
            success: false,
            message: "Access denied - student not found or not assigned to you",
          });
        }
        studentId = req.query.studentId;
      } else if (req.user.role === "student") {
        // For students, we need to find their record in the students table
        const student = await storage.getStudentByEmail(req.user.email);
        if (!student) {
          return res.status(404).json({
            success: false,
            message: "Student record not found",
          });
        }
        studentId = student.id;
      }

      // Get all pending charges for the student
      const charges = await storage.getStudentCharges(studentId);

      res.json({ success: true, charges });
    } catch (error) {
      console.error("Error fetching student charges:", error);
      res.status(500).json({
        success: false,
        message: "Failed to fetch charges",
      });
    }
  });

  // Create PIX payment
  app.post(
    "/api/student/payments/pix",
    isStudentOrTeacher,
    async (req: any, res) => {
      try {
        const { accountId, amount } = req.body;

        if (!accountId || !amount) {
          return res.status(400).json({
            success: false,
            message: "Account ID and amount are required",
          });
        }

        // Verify the charge belongs to the student
        const account = await storage.getFinancialAccount(accountId);
        if (!account) {
          return res.status(404).json({
            success: false,
            message: "Charge not found",
          });
        }

        let studentId = req.user.id;
        if (req.user.role === "student") {
          const student = await storage.getStudentByEmail(req.user.email);
          if (!student) {
            return res.status(404).json({
              success: false,
              message: "Student record not found",
            });
          }
          studentId = student.id;
        }

        if (account.studentId !== studentId) {
          return res.status(403).json({
            success: false,
            message: "Access denied - charge does not belong to you",
          });
        }

        // TODO: Integrate with PIX payment provider (Efí Bank)
        // For now, create a pending payment record
        const transactionId = crypto.randomUUID();

        const paymentData = {
          accountId,
          amount: Number(amount),
          paymentMethod: "pix",
          transactionId,
          providerName: "efi_bank",
          transactionStatus: "pending" as const,
          pixQrCode:
            "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==", // Placeholder
          pixCopyPaste:
            "00020126330014BR.GOV.BCB.PIX0111123456789010203XXXX5204000053039865802BR5925NOME DO RECEBEDOR6009SAO PAULO62240520mpqr60221058999999999630445D5",
          pixExpiresAt: new Date(Date.now() + 30 * 60 * 1000), // 30 minutes
          ipAddress: req.ip || req.connection.remoteAddress,
          userAgent: req.headers["user-agent"],
        };

        const payment = await storage.createPayment(paymentData);

        res.json({
          success: true,
          payment: {
            id: payment.id,
            transactionId: payment.transactionId,
            amount: payment.amount,
            pixQrCode: payment.pixQrCode,
            pixCopyPaste: payment.pixCopyPaste,
            expiresAt: payment.pixExpiresAt,
            status: payment.transactionStatus,
          },
        });
      } catch (error) {
        console.error("Error creating PIX payment:", error);
        res.status(500).json({
          success: false,
          message: "Failed to create PIX payment",
        });
      }
    }
  );

  // Create card payment
  app.post(
    "/api/student/payments/card",
    isStudentOrTeacher,
    async (req: any, res) => {
      try {
        const { accountId, amount, cardToken } = req.body;

        if (!accountId || !amount || !cardToken) {
          return res.status(400).json({
            success: false,
            message: "Account ID, amount and card token are required",
          });
        }

        // Verify the charge belongs to the student
        const account = await storage.getFinancialAccount(accountId);
        if (!account) {
          return res.status(404).json({
            success: false,
            message: "Charge not found",
          });
        }

        let studentId = req.user.id;
        if (req.user.role === "student") {
          const student = await storage.getStudentByEmail(req.user.email);
          if (!student) {
            return res.status(404).json({
              success: false,
              message: "Student record not found",
            });
          }
          studentId = student.id;
        }

        if (account.studentId !== studentId) {
          return res.status(403).json({
            success: false,
            message: "Access denied - charge does not belong to you",
          });
        }

        // TODO: Integrate with card payment provider (Efí Bank)
        // For now, simulate a successful card payment
        const transactionId = crypto.randomUUID();

        const paymentData = {
          accountId,
          amount: Number(amount),
          paymentMethod: "credit_card",
          transactionId,
          providerName: "efi_bank",
          transactionStatus: "completed" as const,
          cardBrand: "visa", // Would come from provider
          cardLastFour: "1234", // Would come from provider
          ipAddress: req.ip || req.connection.remoteAddress,
          userAgent: req.headers["user-agent"],
        };

        const payment = await storage.createPayment(paymentData);

        // Update account as paid if payment is successful
        if (payment.transactionStatus === "completed") {
          await storage.updateFinancialAccount(accountId, {
            status: "paid",
            paidAmount: payment.amount,
            paidAt: new Date(),
          });
        }

        res.json({
          success: true,
          payment: {
            id: payment.id,
            transactionId: payment.transactionId,
            amount: payment.amount,
            status: payment.transactionStatus,
            cardBrand: payment.cardBrand,
            cardLastFour: payment.cardLastFour,
          },
        });
      } catch (error) {
        console.error("Error creating card payment:", error);
        res.status(500).json({
          success: false,
          message: "Failed to create card payment",
        });
      }
    }
  );

  // Payment webhook (for PIX confirmations)
  app.post("/api/payments/webhook", async (req, res) => {
    try {
      // TODO: Implement webhook signature verification
      const { transactionId, status, providerTransactionId } = req.body;

      if (!transactionId) {
        return res.status(400).json({
          success: false,
          message: "Transaction ID is required",
        });
      }

      // Find the payment by transaction ID
      const payment = await storage.getPaymentByTransactionId(transactionId);
      if (!payment) {
        return res.status(404).json({
          success: false,
          message: "Payment not found",
        });
      }

      // Update payment status
      await storage.updatePaymentStatus(payment.id, {
        transactionStatus: status,
        providerTransactionId,
      });

      // If payment is completed, update the financial account
      if (status === "completed") {
        await storage.updateFinancialAccount(payment.accountId, {
          status: "paid",
          paidAmount: payment.amount,
          paidAt: new Date(),
        });
      }

      res.json({ success: true, message: "Webhook processed" });
    } catch (error) {
      console.error("Error processing webhook:", error);
      res.status(500).json({
        success: false,
        message: "Failed to process webhook",
      });
    }
  });

  // Create HTTP server (don't start listening here)
  const httpServer = createServer(app);
  return httpServer;
}
