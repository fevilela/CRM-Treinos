import { db } from "./db";
import {
  users,
  students,
  workouts,
  exercises,
  exerciseTemplates,
  workoutSessions,
  exercisePerformances,
  bodyMeasurements,
  physicalAssessments,
  calendarEvents,
  assessmentPhotos,
  financialAccounts,
  payments,
  workoutHistory,
  postureAssessments,
  posturePhotos,
  postureObservations,
  postureOptions,
  type InsertUser,
  type UpsertUser,
  type User,
  type InsertStudent,
  type Student,
  type InsertWorkout,
  type Workout,
  type InsertExercise,
  type Exercise,
  type InsertExerciseTemplate,
  type ExerciseTemplate,
  type InsertWorkoutSession,
  type WorkoutSession,
  type InsertExercisePerformance,
  type ExercisePerformance,
  type InsertBodyMeasurement,
  type BodyMeasurement,
  type InsertCalendarEvent,
  type CalendarEvent,
  type InsertAssessmentPhoto,
  type AssessmentPhoto,
  type InsertFinancialAccount,
  type FinancialAccount,
  type FinancialAccountFrontend,
  type InsertPayment,
  type Payment,
  type InsertPhysicalAssessment,
  type PhysicalAssessment,
  type InsertWorkoutHistory,
  type WorkoutHistory,
  type PostureAssessment,
  type InsertPostureAssessment,
  type PosturePhoto,
  type InsertPosturePhoto,
  type PostureObservation,
  type InsertPostureObservation,
  type PostureOption,
  type InsertPostureOption,
} from "@shared/schema";
import { eq, desc, asc, and, or, gte, lte, sql, ne } from "drizzle-orm";
import { promises as fs } from "fs";
import path from "path";
import bcrypt from "bcryptjs";
import PDFDocument from "pdfkit";

// Storage interface defining all operations
export interface IStorage {
  // User operations
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  upsertUser(user: UpsertUser): Promise<User>;
  updateUser(id: string, user: Partial<InsertUser>): Promise<User>;

  // Student operations
  getStudents(personalTrainerId: string): Promise<Student[]>;
  getStudent(id: string): Promise<Student | undefined>;
  getStudentByEmail(email: string): Promise<Student | undefined>;
  validateStudentPassword(
    email: string,
    password: string
  ): Promise<Student | undefined>;
  createStudent(student: InsertStudent): Promise<Student>;
  updateStudent(id: string, student: Partial<InsertStudent>): Promise<Student>;
  deleteStudent(id: string): Promise<void>;

  // Workout operations
  getWorkouts(personalTrainerId: string): Promise<Workout[]>;
  getWorkoutsGroupedByStudent(personalTrainerId: string): Promise<
    {
      student: Student;
      workouts: Workout[];
    }[]
  >;
  getStudentWorkouts(studentId: string): Promise<Workout[]>;
  getWorkout(id: string): Promise<Workout | undefined>;
  createWorkout(workout: InsertWorkout): Promise<Workout>;
  updateWorkout(id: string, workout: Partial<InsertWorkout>): Promise<Workout>;
  deleteWorkout(id: string): Promise<void>;

  // Weekday scheduling operations
  getStudentMostRecentWorkout(studentId: string): Promise<Workout | undefined>;

  // Exercise template operations
  getExerciseTemplates(): Promise<ExerciseTemplate[]>;
  createExerciseTemplate(
    template: InsertExerciseTemplate
  ): Promise<ExerciseTemplate>;
  searchExerciseTemplates(query: string): Promise<ExerciseTemplate[]>;

  // Exercise operations
  getWorkoutExercises(workoutId: string): Promise<Exercise[]>;
  createExercise(exercise: InsertExercise): Promise<Exercise>;
  updateExercise(
    id: string,
    exercise: Partial<InsertExercise>
  ): Promise<Exercise>;
  deleteExercise(id: string): Promise<void>;
  deleteWorkoutExercises(workoutId: string): Promise<void>;

  // Workout session operations
  getWorkoutSessions(studentId: string): Promise<WorkoutSession[]>;
  createWorkoutSession(session: InsertWorkoutSession): Promise<WorkoutSession>;
  getRecentSessions(
    personalTrainerId: string,
    limit?: number
  ): Promise<WorkoutSession[]>;

  // Exercise performance operations
  getSessionPerformances(sessionId: string): Promise<ExercisePerformance[]>;
  createExercisePerformance(
    performance: InsertExercisePerformance
  ): Promise<ExercisePerformance>;

  // Workout history operations
  getWorkoutHistory(
    studentId: string,
    exerciseId?: string
  ): Promise<WorkoutHistory[]>;
  createWorkoutHistory(history: InsertWorkoutHistory): Promise<WorkoutHistory>;
  getExerciseProgress(
    studentId: string,
    exerciseId: string
  ): Promise<{
    history: WorkoutHistory[];
    latestWeight: number | null;
    progressTrend: "increasing" | "decreasing" | "stable";
  }>;

  // Body measurement operations
  getStudentMeasurements(studentId: string): Promise<BodyMeasurement[]>;
  createBodyMeasurement(
    measurement: InsertBodyMeasurement
  ): Promise<BodyMeasurement>;

  // Dashboard statistics
  getDashboardStats(personalTrainerId: string): Promise<{
    totalStudents: number;
    activeStudents: number;
    totalWorkouts: number;
    workoutSessions: number;
    recentSessions: WorkoutSession[];
  }>;

  // Calendar operations
  getCalendarEvents(personalTrainerId: string): Promise<CalendarEvent[]>;
  getStudentEvents(studentId: string): Promise<CalendarEvent[]>;
  createCalendarEvent(event: InsertCalendarEvent): Promise<CalendarEvent>;
  updateCalendarEvent(
    id: string,
    event: Partial<InsertCalendarEvent>
  ): Promise<CalendarEvent>;
  deleteCalendarEvent(id: string): Promise<void>;
  getCalendarEvent(eventId: string): Promise<CalendarEvent | undefined>;
  getUpcomingEvents(startDate: Date, endDate: Date): Promise<CalendarEvent[]>;
  markEventReminderSent(eventId: string): Promise<void>;

  // Workout comments operations
  getWorkoutComments(workoutId: string): Promise<any[]>;
  createWorkoutComment(comment: any): Promise<any>;
  updateWorkoutComment(id: string, comment: any): Promise<any>;
  deleteWorkoutComment(id: string): Promise<void>;

  // Body evolution tracking
  getEvolutionPhotos(studentId: string): Promise<AssessmentPhoto[]>;
  createEvolutionPhoto(photo: InsertAssessmentPhoto): Promise<AssessmentPhoto>;

  // Physical assessment operations
  getStudentAssessments(studentId: string): Promise<PhysicalAssessment[]>;
  getPhysicalAssessmentsByTrainer(
    personalTrainerId: string
  ): Promise<PhysicalAssessment[]>;
  createPhysicalAssessment(
    assessment: InsertPhysicalAssessment
  ): Promise<PhysicalAssessment>;
  getPhysicalAssessment(id: string): Promise<PhysicalAssessment | undefined>;
  updatePhysicalAssessment(
    id: string,
    assessment: Partial<InsertPhysicalAssessment>
  ): Promise<PhysicalAssessment>;
  deletePhysicalAssessment(id: string): Promise<void>;

  // Student lookup operations
  getStudentByEmail(email: string): Promise<Student | undefined>;
  getStudentByInviteToken(token: string): Promise<Student | undefined>;
  updateStudentPassword(
    studentId: string,
    hashedPassword: string
  ): Promise<Student>;

  // Financial operations
  getFinancialAccounts(
    personalTrainerId: string,
    filters?: {
      type?: "receivable" | "payable";
      status?: string;
      category?: string;
      studentId?: string;
    }
  ): Promise<FinancialAccountFrontend[]>;
  getFinancialAccount(
    id: string
  ): Promise<FinancialAccountFrontend | undefined>;
  createFinancialAccount(
    account: InsertFinancialAccount
  ): Promise<FinancialAccountFrontend>;
  updateFinancialAccount(
    id: string,
    account: Partial<InsertFinancialAccount>
  ): Promise<FinancialAccountFrontend>;
  deleteFinancialAccount(id: string): Promise<void>;

  // Payment operations
  getPayments(accountId: string): Promise<Payment[]>;
  createPayment(payment: InsertPayment): Promise<Payment>;
  getPaymentsByAccountId(accountId: string): Promise<Payment[]>;
  addPaymentToAccount(
    accountId: string,
    amount: number
  ): Promise<FinancialAccountFrontend>;

  // Financial reporting
  getOverdueAccounts(
    personalTrainerId: string
  ): Promise<FinancialAccountFrontend[]>;
  getStudentDebtSummary(studentId: string): Promise<{
    totalDebt: number;
    overdueAmount: number;
    accountsCount: number;
    lastPaymentDate?: Date;
  }>;
  getFinancialSummary(
    personalTrainerId: string,
    period: string
  ): Promise<{
    monthlyFlow: Array<{ month: string; income: number; expenses: number }>;
    categoryBreakdown: Array<{ category: string; amount: number }>;
    studentDebts: Array<{ studentName: string; debt: number }>;
  }>;

  // Student charges
  getStudentCharges(studentId: string): Promise<FinancialAccountFrontend[]>;

  // Payment status updates
  getPaymentByTransactionId(
    transactionId: string
  ): Promise<Payment | undefined>;
  updatePaymentStatus(
    paymentId: string,
    updates: {
      transactionStatus?:
        | "pending"
        | "processing"
        | "completed"
        | "failed"
        | "cancelled"
        | "refunded";
      providerTransactionId?: string;
    }
  ): Promise<Payment | undefined>;

  // Financial dashboard and charts
  getFinancialDashboard(personalTrainerId: string): Promise<any>;
  getFinancialChartsData(
    personalTrainerId: string,
    period: string
  ): Promise<any>;

  getPaymentReports(
    personalTrainerId: string,
    filters?: {
      startDate?: string;
      endDate?: string;
      studentId?: string;
      paymentMethod?: string;
      accountType?: "receivable" | "payable";
      status?: string;
      category?: string;
      minAmount?: number;
      maxAmount?: number;
    },
    page?: number,
    limit?: number
  ): Promise<any>;

  // PDF generation operations
  generateProgressAnalysisPDF(
    currentAssessment: any,
    previousAssessment?: any
  ): Promise<Buffer>;
  generateFinancialReportPDF(
    personalTrainerId: string,
    studentId?: string,
    filters?: {
      startDate?: string;
      endDate?: string;
      paymentMethod?: string;
      accountType?: "receivable" | "payable";
      status?: string;
      category?: string;
    }
  ): Promise<Buffer>;
}

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async createUser(userData: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(userData).returning();
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  async updateUser(id: string, userData: Partial<InsertUser>): Promise<User> {
    const [user] = await db
      .update(users)
      .set({
        ...userData,
        updatedAt: new Date(),
      })
      .where(eq(users.id, id))
      .returning();
    return user;
  }

  // Student operations
  async getStudents(personalTrainerId: string): Promise<Student[]> {
    const studentsData = await db
      .select()
      .from(students)
      .where(eq(students.personalTrainerId, personalTrainerId))
      .orderBy(desc(students.createdAt));

    // Convert decimal strings back to numbers for frontend
    return studentsData.map(
      (student) =>
        ({
          ...student,
          weight: student.weight ? parseFloat(student.weight as string) : null,
          height: student.height ? parseFloat(student.height as string) : null,
        } as any)
    );
  }

  async getStudent(id: string): Promise<Student | undefined> {
    const [student] = await db
      .select()
      .from(students)
      .where(eq(students.id, id));
    if (!student) return student;

    // Convert decimal strings back to numbers for frontend
    return {
      ...student,
      weight: student.weight ? parseFloat(student.weight as string) : null,
      height: student.height ? parseFloat(student.height as string) : null,
    } as any;
  }

  async createStudent(student: InsertStudent): Promise<Student> {
    const studentData = {
      ...student,
      weight: student.weight?.toString() || null,
      height: student.height?.toString() || null,
    };
    const [newStudent] = await db
      .insert(students)
      .values(studentData)
      .returning();

    // Convert back to numbers
    return {
      ...newStudent,
      weight: newStudent.weight
        ? parseFloat(newStudent.weight as string)
        : null,
      height: newStudent.height
        ? parseFloat(newStudent.height as string)
        : null,
    } as any;
  }

  async updateStudent(
    id: string,
    student: Partial<InsertStudent>
  ): Promise<Student> {
    const studentData = {
      ...student,
      weight: student.weight?.toString() || undefined,
      height: student.height?.toString() || undefined,
      updatedAt: new Date(),
    };

    const [updatedStudent] = await db
      .update(students)
      .set(studentData)
      .where(eq(students.id, id))
      .returning();

    // Convert back to numbers
    return {
      ...updatedStudent,
      weight: updatedStudent.weight
        ? parseFloat(updatedStudent.weight as string)
        : null,
      height: updatedStudent.height
        ? parseFloat(updatedStudent.height as string)
        : null,
    } as any;
  }

  async deleteStudent(id: string): Promise<void> {
    await db.delete(students).where(eq(students.id, id));
  }

  // Student lookup operations
  async getStudentByEmail(email: string): Promise<Student | undefined> {
    const [student] = await db
      .select()
      .from(students)
      .where(eq(students.email, email));

    if (!student) return undefined;

    // Convert decimal strings back to numbers for frontend
    return {
      ...student,
      weight: student.weight ? parseFloat(student.weight as string) : null,
      height: student.height ? parseFloat(student.height as string) : null,
    } as any;
  }

  async validateStudentPassword(
    email: string,
    password: string
  ): Promise<Student | undefined> {
    const student = await this.getStudentByEmail(email);

    if (!student || !student.password) {
      return undefined;
    }

    const isValidPassword = await bcrypt.compare(password, student.password);
    if (!isValidPassword) {
      return undefined;
    }

    return student;
  }

  async getStudentByInviteToken(token: string): Promise<Student | undefined> {
    const [student] = await db
      .select()
      .from(students)
      .where(eq(students.inviteToken, token));

    if (!student) return undefined;

    // Convert decimal strings back to numbers for frontend
    return {
      ...student,
      weight: student.weight ? parseFloat(student.weight as string) : null,
      height: student.height ? parseFloat(student.height as string) : null,
    } as any;
  }

  async updateStudentPassword(
    studentId: string,
    hashedPassword: string
  ): Promise<Student> {
    const [updatedStudent] = await db
      .update(students)
      .set({
        password: hashedPassword,
        inviteToken: null, // Remove token after password is set
        updatedAt: new Date(),
      })
      .where(eq(students.id, studentId))
      .returning();

    // Convert decimal strings back to numbers for frontend
    return {
      ...updatedStudent,
      weight: updatedStudent.weight
        ? parseFloat(updatedStudent.weight as string)
        : null,
      height: updatedStudent.height
        ? parseFloat(updatedStudent.height as string)
        : null,
    } as any;
  }

  // Student charges method
  async getStudentCharges(
    studentId: string
  ): Promise<FinancialAccountFrontend[]> {
    const accounts = await db
      .select()
      .from(financialAccounts)
      .where(
        and(
          eq(financialAccounts.studentId, studentId),
          eq(financialAccounts.type, "receivable"),
          sql`${financialAccounts.status} != 'paid'`
        )
      )
      .orderBy(desc(financialAccounts.createdAt));

    return accounts.map((account) => ({
      ...account,
      amount: account.amount ? parseFloat(account.amount as string) : 0,
      paidAmount: account.paidAmount
        ? parseFloat(account.paidAmount as string)
        : 0,
    })) as FinancialAccountFrontend[];
  }

  // Workout operations
  async getWorkouts(personalTrainerId: string): Promise<Workout[]> {
    const workoutsData = await db
      .select()
      .from(workouts)
      .where(eq(workouts.personalTrainerId, personalTrainerId))
      .orderBy(workouts.createdAt);
    return workoutsData;
  }

  async getWorkoutsGroupedByStudent(personalTrainerId: string): Promise<
    {
      student: Student;
      workouts: Workout[];
    }[]
  > {
    // Primeiro buscar todos os alunos do personal trainer
    const studentsData = await this.getStudents(personalTrainerId);

    // Para cada aluno, buscar seus treinos
    const result = await Promise.all(
      studentsData.map(async (student) => {
        const studentWorkouts = await db
          .select()
          .from(workouts)
          .where(
            and(
              eq(workouts.personalTrainerId, personalTrainerId),
              eq(workouts.studentId, student.id)
            )
          )
          .orderBy(desc(workouts.createdAt));

        return {
          student,
          workouts: studentWorkouts,
        };
      })
    );

    // Retornar apenas alunos que têm pelo menos um treino
    return result.filter((item) => item.workouts.length > 0);
  }
  async getStudentWorkouts(studentId: string): Promise<Workout[]> {
    const workoutsData = await db
      .select()
      .from(workouts)
      .where(eq(workouts.studentId, studentId))
      .orderBy(desc(workouts.createdAt));
    return workoutsData;
  }
  async getWorkout(id: string): Promise<Workout | undefined> {
    return undefined;
  }
  async createWorkout(workout: InsertWorkout): Promise<Workout> {
    console.log("STORAGE: Creating workout with data:", workout);
    const [createdWorkout] = await db
      .insert(workouts)
      .values(workout)
      .returning();
    console.log("STORAGE: Created workout:", createdWorkout);
    return createdWorkout;
  }
  async updateWorkout(
    id: string,
    workout: Partial<InsertWorkout>
  ): Promise<Workout> {
    return {} as Workout;
  }
  async deleteWorkout(id: string): Promise<void> {}
  async getStudentMostRecentWorkout(
    studentId: string
  ): Promise<Workout | undefined> {
    return undefined;
  }
  async getExerciseTemplates(): Promise<ExerciseTemplate[]> {
    console.log("STORAGE: Fetching exercise templates");
    const templates = await db
      .select()
      .from(exerciseTemplates)
      .orderBy(exerciseTemplates.name);
    console.log("STORAGE: Found exercise templates:", templates);
    return templates;
  }
  async createExerciseTemplate(
    template: InsertExerciseTemplate
  ): Promise<ExerciseTemplate> {
    console.log("STORAGE: Creating exercise template with data:", template);
    const [createdTemplate] = await db
      .insert(exerciseTemplates)
      .values(template)
      .returning();
    console.log("STORAGE: Created exercise template:", createdTemplate);
    return createdTemplate;
  }
  async searchExerciseTemplates(query: string): Promise<ExerciseTemplate[]> {
    console.log("STORAGE: Searching exercise templates with query:", query);
    const searchResults = await db
      .select()
      .from(exerciseTemplates)
      .where(
        sql`LOWER(${exerciseTemplates.name}) LIKE LOWER(${"%" + query + "%"})`
      )
      .orderBy(exerciseTemplates.name);
    console.log("STORAGE: Search results:", searchResults);
    return searchResults;
  }
  async getWorkoutExercises(workoutId: string): Promise<Exercise[]> {
    console.log("STORAGE: Fetching exercises for workout:", workoutId);
    const workoutExercises = await db
      .select()
      .from(exercises)
      .where(eq(exercises.workoutId, workoutId))
      .orderBy(exercises.order);
    console.log("STORAGE: Found exercises:", workoutExercises);
    return workoutExercises;
  }
  async createExercise(exercise: InsertExercise): Promise<Exercise> {
    console.log("STORAGE: Creating exercise with data:", exercise);
    const [createdExercise] = await db
      .insert(exercises)
      .values(exercise)
      .returning();
    console.log("STORAGE: Created exercise in database:", createdExercise);
    return createdExercise;
  }
  async updateExercise(
    id: string,
    exercise: Partial<InsertExercise>
  ): Promise<Exercise> {
    return {} as Exercise;
  }
  async deleteExercise(id: string): Promise<void> {}
  async deleteWorkoutExercises(workoutId: string): Promise<void> {}
  async getWorkoutSessions(studentId: string): Promise<WorkoutSession[]> {
    return [];
  }
  async createWorkoutSession(
    session: InsertWorkoutSession
  ): Promise<WorkoutSession> {
    return {} as WorkoutSession;
  }
  async getRecentSessions(
    personalTrainerId: string,
    limit?: number
  ): Promise<WorkoutSession[]> {
    return [];
  }
  async getSessionPerformances(
    sessionId: string
  ): Promise<ExercisePerformance[]> {
    return [];
  }
  async createExercisePerformance(
    performance: InsertExercisePerformance
  ): Promise<ExercisePerformance> {
    const [newPerformance] = await db
      .insert(exercisePerformances)
      .values(performance)
      .returning();
    return newPerformance;
  }

  // Workout history operations
  async getWorkoutHistory(
    studentId: string,
    exerciseId?: string
  ): Promise<WorkoutHistory[]> {
    const whereCondition = exerciseId
      ? and(
          eq(workoutHistory.studentId, studentId),
          eq(workoutHistory.exerciseId, exerciseId)
        )
      : eq(workoutHistory.studentId, studentId);

    const historyData = await db
      .select()
      .from(workoutHistory)
      .where(whereCondition)
      .orderBy(desc(workoutHistory.completedAt))
      .limit(50); // Add pagination limit for performance

    // Return records as-is since database decimal fields are returned as strings
    return historyData as WorkoutHistory[];
  }

  async createWorkoutHistory(
    history: InsertWorkoutHistory
  ): Promise<WorkoutHistory> {
    // Server-side validation
    if (!history.studentId || !history.exerciseId) {
      throw new Error("studentId and exerciseId are required");
    }

    if (
      history.sets != null &&
      (history.sets <= 0 || !Number.isInteger(history.sets))
    ) {
      throw new Error("Sets must be a positive integer");
    }

    if (
      history.weight != null &&
      (!Number.isFinite(Number(history.weight)) || Number(history.weight) < 0)
    ) {
      throw new Error("Weight must be a non-negative finite number");
    }

    if (
      history.previousWeight != null &&
      (!Number.isFinite(Number(history.previousWeight)) ||
        Number(history.previousWeight) < 0)
    ) {
      throw new Error("Previous weight must be a non-negative finite number");
    }

    if (
      history.percentageChange != null &&
      !Number.isFinite(Number(history.percentageChange))
    ) {
      throw new Error("Percentage change must be a finite number");
    }

    // Prepare data for database insertion with proper typing
    const historyData: typeof workoutHistory.$inferInsert = {
      studentId: history.studentId,
      exerciseId: history.exerciseId,
      exerciseName: history.exerciseName,
      sets: history.sets,
      reps: history.reps,
      weight: history.weight ?? "0", // Use default weight if not provided
      previousWeight: history.previousWeight || null,
      changeType: history.changeType || null,
      percentageChange: history.percentageChange || null,
      comments: history.comments || null,
      workoutSessionId: history.workoutSessionId || null,
      completedAt: new Date(), // Set server-side timestamp
    };

    const [newHistory] = await db
      .insert(workoutHistory)
      .values(historyData)
      .returning();

    // Return the inserted record as-is
    return newHistory as WorkoutHistory;
  }

  async getExerciseProgress(
    studentId: string,
    exerciseId: string
  ): Promise<{
    history: WorkoutHistory[];
    latestWeight: number | null;
    progressTrend: "increasing" | "decreasing" | "stable";
  }> {
    const progressData = await db
      .select()
      .from(workoutHistory)
      .where(
        and(
          eq(workoutHistory.studentId, studentId),
          eq(workoutHistory.exerciseId, exerciseId)
        )
      )
      .orderBy(desc(workoutHistory.completedAt))
      .limit(10); // Get last 10 records for progress tracking

    // Use data as-is since decimal fields are returned as strings
    const normalizedHistory = progressData as WorkoutHistory[];

    const latestWeight = normalizedHistory[0]?.weight
      ? parseFloat(normalizedHistory[0].weight)
      : null;
    let progressTrend: "increasing" | "decreasing" | "stable" = "stable";

    // Calculate trend only if we have valid weight values for comparison
    if (normalizedHistory.length > 1) {
      const currentWeight = normalizedHistory[0]?.weight
        ? parseFloat(normalizedHistory[0].weight)
        : null;
      const previousWeight = normalizedHistory[1]?.weight
        ? parseFloat(normalizedHistory[1].weight)
        : null;

      if (currentWeight !== null && previousWeight !== null) {
        if (currentWeight > previousWeight) {
          progressTrend = "increasing";
        } else if (currentWeight < previousWeight) {
          progressTrend = "decreasing";
        }
      }
    }

    return {
      history: normalizedHistory,
      latestWeight,
      progressTrend,
    };
  }

  // Financial Account Operations
  async getFinancialAccounts(
    personalTrainerId: string,
    filters?: {
      type?: "receivable" | "payable";
      status?: string;
      category?: string;
      studentId?: string;
      period?: "week" | "month" | "semester" | "year";
    }
  ): Promise<FinancialAccountFrontend[]> {
    let query = db
      .select({
        id: financialAccounts.id,
        personalTrainerId: financialAccounts.personalTrainerId,
        studentId: financialAccounts.studentId,
        studentName: students.name,
        type: financialAccounts.type,
        category: financialAccounts.category,
        title: financialAccounts.title,
        description: financialAccounts.description,
        amount: financialAccounts.amount,
        dueDate: financialAccounts.dueDate,
        status: financialAccounts.status,
        paidAmount: financialAccounts.paidAmount,
        paidAt: financialAccounts.paidAt,
        installments: financialAccounts.installments,
        currentInstallment: financialAccounts.currentInstallment,
        isRecurring: financialAccounts.isRecurring,
        recurringInterval: financialAccounts.recurringInterval,
        notes: financialAccounts.notes,
        createdAt: financialAccounts.createdAt,
        updatedAt: financialAccounts.updatedAt,
      })
      .from(financialAccounts)
      .leftJoin(students, eq(financialAccounts.studentId, students.id));

    // Apply filters
    const conditions = [
      eq(financialAccounts.personalTrainerId, personalTrainerId),
    ];

    if (filters?.type) {
      conditions.push(eq(financialAccounts.type, filters.type));
    }

    if (
      filters?.status &&
      (filters.status === "pending" ||
        filters.status === "partial" ||
        filters.status === "paid" ||
        filters.status === "overdue" ||
        filters.status === "cancelled")
    ) {
      conditions.push(eq(financialAccounts.status, filters.status as any));
    }

    if (
      filters?.category &&
      [
        "equipment",
        "student_monthly",
        "student_assessment",
        "student_personal_training",
        "supplements",
        "marketing",
        "infrastructure",
        "other",
      ].includes(filters.category)
    ) {
      conditions.push(eq(financialAccounts.category, filters.category as any));
    }

    if (filters?.studentId) {
      conditions.push(eq(financialAccounts.studentId, filters.studentId));
    }

    // Period filters
    if (filters?.period) {
      const now = new Date();
      let startDate: Date;
      let endDate: Date;

      switch (filters.period) {
        case "week":
          startDate = new Date(now);
          startDate.setDate(now.getDate() - now.getDay()); // Start of week (Sunday)
          startDate.setHours(0, 0, 0, 0);

          endDate = new Date(startDate);
          endDate.setDate(startDate.getDate() + 6); // End of week
          endDate.setHours(23, 59, 59, 999);
          break;
        case "month":
          startDate = new Date(now.getFullYear(), now.getMonth(), 1);
          endDate = new Date(
            now.getFullYear(),
            now.getMonth() + 1,
            0,
            23,
            59,
            59,
            999
          );
          break;
        case "semester":
          const currentMonth = now.getMonth();
          const semesterStart = currentMonth < 6 ? 0 : 6; // Jan-Jun or Jul-Dec
          startDate = new Date(now.getFullYear(), semesterStart, 1);
          endDate = new Date(
            now.getFullYear(),
            semesterStart + 6,
            0,
            23,
            59,
            59,
            999
          );
          break;
        case "year":
          startDate = new Date(now.getFullYear(), 0, 1);
          endDate = new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999);
          break;
        default:
          startDate = new Date(0);
          endDate = new Date();
      }

      conditions.push(
        and(
          gte(financialAccounts.dueDate, startDate),
          lte(financialAccounts.dueDate, endDate)
        ) as any
      );
    }

    const result = await query
      .where(conditions.length > 0 ? (and(...conditions) as any) : undefined)
      .orderBy(desc(financialAccounts.dueDate));

    // Convert decimal strings to numbers for frontend and maintain proper typing
    return result.map(
      (
        account
      ): FinancialAccountFrontend & { studentName?: string | null } => ({
        id: account.id,
        createdAt: account.createdAt,
        updatedAt: account.updatedAt,
        personalTrainerId: account.personalTrainerId,
        studentId: account.studentId,
        type: account.type,
        category: account.category,
        title: account.title,
        description: account.description,
        amount:
          typeof account.amount === "string"
            ? parseFloat(account.amount)
            : account.amount,
        dueDate: account.dueDate,
        status: account.status,
        paidAmount: account.paidAmount
          ? typeof account.paidAmount === "string"
            ? parseFloat(account.paidAmount)
            : account.paidAmount
          : 0,
        paidAt: account.paidAt,
        installments: account.installments,
        currentInstallment: account.currentInstallment,
        isRecurring: account.isRecurring,
        recurringInterval: account.recurringInterval,
        notes: account.notes,
        studentName: account.studentName,
      })
    );
  }

  async getFinancialAccount(
    id: string
  ): Promise<FinancialAccountFrontend | undefined> {
    const [account] = await db
      .select()
      .from(financialAccounts)
      .where(eq(financialAccounts.id, id));

    if (!account) return undefined;

    return {
      id: account.id,
      createdAt: account.createdAt,
      updatedAt: account.updatedAt,
      personalTrainerId: account.personalTrainerId,
      studentId: account.studentId,
      type: account.type,
      category: account.category,
      title: account.title,
      description: account.description,
      amount:
        typeof account.amount === "string"
          ? parseFloat(account.amount)
          : account.amount,
      dueDate: account.dueDate,
      status: account.status,
      paidAmount: account.paidAmount
        ? typeof account.paidAmount === "string"
          ? parseFloat(account.paidAmount)
          : account.paidAmount
        : 0,
      paidAt: account.paidAt,
      installments: account.installments,
      currentInstallment: account.currentInstallment,
      isRecurring: account.isRecurring,
      recurringInterval: account.recurringInterval,
      notes: account.notes,
    };
  }

  async createFinancialAccount(
    account: InsertFinancialAccount
  ): Promise<FinancialAccountFrontend> {
    const [newAccount] = await db
      .insert(financialAccounts)
      .values({
        ...account,
        amount:
          typeof account.amount === "number"
            ? account.amount.toString()
            : account.amount,
        paidAmount: account.paidAmount
          ? typeof account.paidAmount === "number"
            ? account.paidAmount.toString()
            : account.paidAmount
          : "0",
      })
      .returning();

    return {
      id: newAccount.id,
      createdAt: newAccount.createdAt,
      updatedAt: newAccount.updatedAt,
      personalTrainerId: newAccount.personalTrainerId,
      studentId: newAccount.studentId,
      type: newAccount.type,
      category: newAccount.category,
      title: newAccount.title,
      description: newAccount.description,
      amount:
        typeof newAccount.amount === "string"
          ? parseFloat(newAccount.amount)
          : newAccount.amount,
      dueDate: newAccount.dueDate,
      status: newAccount.status,
      paidAmount: newAccount.paidAmount
        ? typeof newAccount.paidAmount === "string"
          ? parseFloat(newAccount.paidAmount)
          : newAccount.paidAmount
        : 0,
      paidAt: newAccount.paidAt,
      installments: newAccount.installments,
      currentInstallment: newAccount.currentInstallment,
      isRecurring: newAccount.isRecurring,
      recurringInterval: newAccount.recurringInterval,
      notes: newAccount.notes,
    };
  }

  async updateFinancialAccount(
    id: string,
    account: Partial<InsertFinancialAccount>
  ): Promise<FinancialAccountFrontend> {
    const updateData = {
      ...account,
      updatedAt: new Date(),
    };

    // Convert numeric fields to strings for decimal storage
    if (account.amount !== undefined) {
      (updateData as any).amount =
        typeof account.amount === "number"
          ? account.amount.toString()
          : account.amount;
    }
    if (account.paidAmount !== undefined) {
      (updateData as any).paidAmount =
        typeof account.paidAmount === "number"
          ? account.paidAmount.toString()
          : account.paidAmount;
    }

    const [updatedAccount] = await db
      .update(financialAccounts)
      .set(updateData as any)
      .where(eq(financialAccounts.id, id))
      .returning();

    return {
      id: updatedAccount.id,
      createdAt: updatedAccount.createdAt,
      updatedAt: updatedAccount.updatedAt,
      personalTrainerId: updatedAccount.personalTrainerId,
      studentId: updatedAccount.studentId,
      type: updatedAccount.type,
      category: updatedAccount.category,
      title: updatedAccount.title,
      description: updatedAccount.description,
      amount:
        typeof updatedAccount.amount === "string"
          ? parseFloat(updatedAccount.amount)
          : updatedAccount.amount,
      dueDate: updatedAccount.dueDate,
      status: updatedAccount.status,
      paidAmount: updatedAccount.paidAmount
        ? typeof updatedAccount.paidAmount === "string"
          ? parseFloat(updatedAccount.paidAmount)
          : updatedAccount.paidAmount
        : 0,
      paidAt: updatedAccount.paidAt,
      installments: updatedAccount.installments,
      currentInstallment: updatedAccount.currentInstallment,
      isRecurring: updatedAccount.isRecurring,
      recurringInterval: updatedAccount.recurringInterval,
      notes: updatedAccount.notes,
    };
  }

  async deleteFinancialAccount(id: string): Promise<void> {
    await db.delete(financialAccounts).where(eq(financialAccounts.id, id));
  }

  async getFinancialDashboard(personalTrainerId: string): Promise<any> {
    const accounts = await this.getFinancialAccounts(personalTrainerId);

    const totalReceivable = accounts
      .filter((acc) => acc.type === "receivable" && acc.status !== "paid")
      .reduce(
        (sum, acc) => sum + (Number(acc.amount) - Number(acc.paidAmount || 0)),
        0
      );

    const totalPayable = accounts
      .filter((acc) => acc.type === "payable" && acc.status !== "paid")
      .reduce(
        (sum, acc) => sum + (Number(acc.amount) - Number(acc.paidAmount || 0)),
        0
      );

    const totalOverdue = accounts
      .filter((acc) => acc.status === "overdue")
      .reduce(
        (sum, acc) => sum + (Number(acc.amount) - Number(acc.paidAmount || 0)),
        0
      );

    // Calculate monthly income/expenses for current month
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    const monthlyAccounts = accounts.filter(
      (acc) => new Date(acc.dueDate) >= monthStart
    );

    const monthlyIncome = monthlyAccounts
      .filter((acc) => acc.type === "receivable")
      .reduce((sum, acc) => sum + Number(acc.amount), 0);

    const monthlyExpenses = monthlyAccounts
      .filter((acc) => acc.type === "payable")
      .reduce((sum, acc) => sum + Number(acc.amount), 0);

    const netIncome = monthlyIncome - monthlyExpenses;

    return {
      totalReceivable,
      totalPayable,
      totalOverdue,
      monthlyIncome,
      monthlyExpenses,
      netIncome,
      pendingPayments: accounts.filter((acc) => acc.status === "pending")
        .length,
    };
  }
  async getStudentMeasurements(studentId: string): Promise<BodyMeasurement[]> {
    return [];
  }
  async createBodyMeasurement(
    measurement: InsertBodyMeasurement
  ): Promise<BodyMeasurement> {
    return {} as BodyMeasurement;
  }
  async getDashboardStats(personalTrainerId: string): Promise<any> {
    return {
      totalStudents: 0,
      activeStudents: 0,
      totalWorkouts: 0,
      workoutSessions: 0,
      recentSessions: [],
    };
  }
  async getCalendarEvents(personalTrainerId: string): Promise<CalendarEvent[]> {
    return [];
  }
  async getStudentEvents(studentId: string): Promise<CalendarEvent[]> {
    return [];
  }
  async createCalendarEvent(
    event: InsertCalendarEvent
  ): Promise<CalendarEvent> {
    return {} as CalendarEvent;
  }
  async updateCalendarEvent(
    id: string,
    event: Partial<InsertCalendarEvent>
  ): Promise<CalendarEvent> {
    return {} as CalendarEvent;
  }
  async deleteCalendarEvent(id: string): Promise<void> {}

  async getCalendarEvent(eventId: string): Promise<CalendarEvent | undefined> {
    const [event] = await db
      .select()
      .from(calendarEvents)
      .where(eq(calendarEvents.id, eventId));
    return event;
  }

  async getUpcomingEvents(
    startDate: Date,
    endDate: Date
  ): Promise<CalendarEvent[]> {
    return await db
      .select()
      .from(calendarEvents)
      .where(
        and(
          gte(calendarEvents.startTime, startDate),
          lte(calendarEvents.startTime, endDate)
        )
      )
      .orderBy(asc(calendarEvents.startTime));
  }

  async markEventReminderSent(eventId: string): Promise<void> {
    await db
      .update(calendarEvents)
      .set({ reminderSent: true })
      .where(eq(calendarEvents.id, eventId));
  }

  // Workout comments operations
  async getWorkoutComments(workoutId: string): Promise<any[]> {
    return [];
  }

  async createWorkoutComment(comment: any): Promise<any> {
    return {};
  }

  async updateWorkoutComment(id: string, comment: any): Promise<any> {
    return {};
  }

  async deleteWorkoutComment(id: string): Promise<void> {}

  // Assessment photo operations
  async getAssessmentPhotos(studentId: string): Promise<AssessmentPhoto[]> {
    return [];
  }

  async createAssessmentPhoto(photo: any): Promise<any> {
    return {};
  }

  async getAssessmentPhoto(photoId: string): Promise<any> {
    return undefined;
  }

  async deleteAssessmentPhoto(photoId: string): Promise<void> {}

  // Student assessment history operations
  async getStudentAssessmentHistory(studentId: string): Promise<any[]> {
    return [];
  }

  async getPhysicalAssessmentHistory(assessmentId: string): Promise<any[]> {
    return [];
  }

  // Other missing methods
  async generateProgressAnalysisPDF(
    currentAssessment: any,
    previousAssessment?: any
  ): Promise<Buffer> {
    return Buffer.from("");
  }

  async generateFinancialReportPDF(
    personalTrainerId: string,
    studentId?: string,
    filters: {
      startDate?: string;
      endDate?: string;
      paymentMethod?: string;
      accountType?: "receivable" | "payable";
      status?: string;
      category?: string;
    } = {}
  ): Promise<Buffer> {
    try {
      // Get financial data
      const reportData = await this.getPaymentReports(
        personalTrainerId,
        {
          ...filters,
          studentId,
        },
        1,
        1000
      ); // Get all records for PDF

      // Get student info if specific student report
      let studentInfo = null;
      if (studentId) {
        studentInfo = await this.getStudent(studentId);
      }

      // Get trainer info
      const trainerInfo = await this.getUser(personalTrainerId);

      // Create PDF document
      const doc = new PDFDocument({ margin: 50 });
      const chunks: Buffer[] = [];

      doc.on("data", (chunk: Buffer) => chunks.push(chunk));

      return new Promise((resolve, reject) => {
        doc.on("end", () => {
          resolve(Buffer.concat(chunks));
        });

        doc.on("error", reject);

        // Header
        doc
          .fontSize(20)
          .font("Helvetica-Bold")
          .text("RELATÓRIO FINANCEIRO", { align: "center" });
        doc.moveDown();

        // Trainer info
        doc
          .fontSize(12)
          .font("Helvetica")
          .text(
            `Personal Trainer: ${trainerInfo?.firstName} ${trainerInfo?.lastName}`
          );
        if (studentInfo) {
          doc.text(`Aluno: ${studentInfo.name}`);
          doc.text(`Email: ${studentInfo.email}`);
        }

        // Report period
        const today = new Date().toLocaleDateString("pt-BR");
        doc.text(`Data do relatório: ${today}`);
        if (filters.startDate || filters.endDate) {
          const start = filters.startDate
            ? new Date(filters.startDate).toLocaleDateString("pt-BR")
            : "Início";
          const end = filters.endDate
            ? new Date(filters.endDate).toLocaleDateString("pt-BR")
            : "Hoje";
          doc.text(`Período: ${start} até ${end}`);
        }
        doc.moveDown();

        // Summary
        doc.fontSize(16).font("Helvetica-Bold").text("RESUMO FINANCEIRO");
        doc.fontSize(12).font("Helvetica");
        doc.text(`Total de transações: ${reportData.totalCount}`);
        doc.text(
          `Valor total: R$ ${reportData.summary.totalAmount.toFixed(2)}`
        );
        doc.text(
          `Valor médio por transação: R$ ${reportData.summary.averagePayment.toFixed(
            2
          )}`
        );
        doc.moveDown();

        // Payment method breakdown
        if (Object.keys(reportData.summary.paymentMethodBreakdown).length > 0) {
          doc.fontSize(14).font("Helvetica-Bold").text("Métodos de Pagamento:");
          doc.fontSize(10).font("Helvetica");
          for (const [method, amount] of Object.entries(
            reportData.summary.paymentMethodBreakdown
          )) {
            const methodName = this.getPaymentMethodName(method);
            doc.text(`• ${methodName}: R$ ${amount.toFixed(2)}`);
          }
          doc.moveDown();
        }

        // Category breakdown
        if (Object.keys(reportData.summary.categoryBreakdown).length > 0) {
          doc.fontSize(14).font("Helvetica-Bold").text("Categorias:");
          doc.fontSize(10).font("Helvetica");
          for (const [category, amount] of Object.entries(
            reportData.summary.categoryBreakdown
          )) {
            const categoryName = this.getCategoryName(category);
            doc.text(`• ${categoryName}: R$ ${amount.toFixed(2)}`);
          }
          doc.moveDown();
        }

        // Payments table
        doc
          .fontSize(16)
          .font("Helvetica-Bold")
          .text("DETALHAMENTO DE TRANSAÇÕES");
        doc.moveDown();

        // Table headers
        const startX = 50;
        let currentY = doc.y;
        doc.fontSize(10).font("Helvetica-Bold");
        doc.text("Data", startX, currentY);
        doc.text("Descrição", startX + 80, currentY);
        doc.text("Método", startX + 200, currentY);
        doc.text("Status", startX + 270, currentY);
        doc.text("Valor Total", startX + 320, currentY);
        doc.text("Valor Pago", startX + 390, currentY);
        doc.text("Saldo", startX + 460, currentY);

        currentY += 20;
        doc
          .moveTo(startX, currentY - 10)
          .lineTo(startX + 500, currentY - 10)
          .stroke();

        // Table rows
        doc.fontSize(8).font("Helvetica");
        for (const payment of reportData.payments) {
          // Check if we need a new page
          if (currentY > 700) {
            doc.addPage();
            currentY = 50;
            // Repeat headers on new page
            doc.fontSize(10).font("Helvetica-Bold");
            doc.text("Data", startX, currentY);
            doc.text("Descrição", startX + 80, currentY);
            doc.text("Método", startX + 200, currentY);
            doc.text("Status", startX + 270, currentY);
            doc.text("Valor Total", startX + 320, currentY);
            doc.text("Valor Pago", startX + 390, currentY);
            doc.text("Saldo", startX + 460, currentY);
            currentY += 20;
            doc
              .moveTo(startX, currentY - 10)
              .lineTo(startX + 500, currentY - 10)
              .stroke();
            doc.fontSize(8).font("Helvetica");
          }

          const paymentDate = new Date(payment.paymentDate).toLocaleDateString(
            "pt-BR"
          );
          const description = payment.account.title;
          const method = this.getPaymentMethodName(payment.paymentMethod);
          const status = this.getStatusName(payment.account.status);
          const totalAmount = payment.account.totalAmount;
          const paidAmount = payment.amount;
          const balance = totalAmount - paidAmount;

          doc.text(paymentDate, startX, currentY, {
            width: 70,
            ellipsis: true,
          });
          doc.text(description, startX + 80, currentY, {
            width: 110,
            ellipsis: true,
          });
          doc.text(method, startX + 200, currentY, {
            width: 60,
            ellipsis: true,
          });
          doc.text(status, startX + 270, currentY, {
            width: 45,
            ellipsis: true,
          });
          doc.text(`R$ ${totalAmount.toFixed(2)}`, startX + 320, currentY, {
            width: 60,
            ellipsis: true,
          });
          doc.text(`R$ ${paidAmount.toFixed(2)}`, startX + 390, currentY, {
            width: 60,
            ellipsis: true,
          });
          doc.text(`R$ ${balance.toFixed(2)}`, startX + 460, currentY, {
            width: 60,
            ellipsis: true,
          });

          currentY += 15;
        }

        // Footer
        doc.fontSize(8).font("Helvetica");
        doc.text(
          "Relatório gerado automaticamente pelo sistema CRM Treinos MP",
          50,
          750,
          { align: "center" }
        );

        doc.end();
      });
    } catch (error) {
      console.error("Error generating financial PDF:", error);
      throw new Error("Falha ao gerar PDF financeiro");
    }
  }

  private getPaymentMethodName(method: string): string {
    const methods: { [key: string]: string } = {
      cash: "Dinheiro",
      pix: "PIX",
      credit_card: "Cartão de Crédito",
      debit_card: "Cartão de Débito",
      bank_transfer: "Transferência",
      boleto: "Boleto",
    };
    return methods[method] || method;
  }

  private getCategoryName(category: string): string {
    const categories: { [key: string]: string } = {
      student_monthly: "Mensalidade",
      student_assessment: "Avaliação Física",
      student_personal_training: "Personal Training",
      rent: "Aluguel",
      equipment: "Equipamentos",
      marketing: "Marketing",
      utilities: "Utilidades",
      insurance: "Seguro",
      other: "Outros",
    };
    return categories[category] || category;
  }

  private getStatusName(status: string): string {
    const statuses: { [key: string]: string } = {
      pending: "Pendente",
      partial: "Parcial",
      paid: "Pago",
      overdue: "Atrasado",
      cancelled: "Cancelado",
    };
    return statuses[status] || status;
  }

  async getEvolutionPhotos(studentId: string): Promise<AssessmentPhoto[]> {
    return [];
  }
  async createEvolutionPhoto(
    photo: InsertAssessmentPhoto
  ): Promise<AssessmentPhoto> {
    return {} as AssessmentPhoto;
  }
  async getStudentAssessments(
    studentId: string
  ): Promise<PhysicalAssessment[]> {
    const assessments = await db
      .select()
      .from(physicalAssessments)
      .where(eq(physicalAssessments.studentId, studentId))
      .orderBy(desc(physicalAssessments.createdAt));
    return assessments;
  }

  // Método para buscar todas as avaliações físicas dos alunos de um personal trainer
  async getPhysicalAssessmentsByTrainer(
    personalTrainerId: string
  ): Promise<PhysicalAssessment[]> {
    const assessments = await db
      .select()
      .from(physicalAssessments)
      .where(eq(physicalAssessments.personalTrainerId, personalTrainerId))
      .orderBy(desc(physicalAssessments.createdAt));
    return assessments;
  }
  async createPhysicalAssessment(
    assessment: InsertPhysicalAssessment
  ): Promise<PhysicalAssessment> {
    return {} as PhysicalAssessment;
  }
  async getPhysicalAssessment(
    id: string
  ): Promise<PhysicalAssessment | undefined> {
    return undefined;
  }
  async updatePhysicalAssessment(
    id: string,
    assessment: Partial<InsertPhysicalAssessment>
  ): Promise<PhysicalAssessment> {
    return {} as PhysicalAssessment;
  }
  async deletePhysicalAssessment(id: string): Promise<void> {}

  async getPayments(accountId: string): Promise<Payment[]> {
    return this.getPaymentsByAccountId(accountId);
  }

  async createPayment(payment: InsertPayment): Promise<Payment> {
    // Validate that account exists
    const account = await this.getFinancialAccount(payment.accountId);
    if (!account) {
      throw new Error("Financial account not found");
    }

    if (payment.amount <= 0) {
      throw new Error("Payment amount must be positive");
    }

    // Validate payment doesn't exceed remaining balance
    const remainingBalance = account.amount - account.paidAmount;
    if (payment.amount > remainingBalance) {
      throw new Error(
        `Payment amount (${payment.amount.toFixed(
          2
        )}) exceeds remaining balance (${remainingBalance.toFixed(2)})`
      );
    }

    // Create payment record
    const [createdPayment] = await db
      .insert(payments)
      .values({
        ...payment,
        amount: payment.amount.toString(), // Convert to decimal string for database
        paymentDate: payment.paymentDate || new Date(),
      })
      .returning();

    // Update financial account with new paid amount
    const newPaidAmount = account.paidAmount + payment.amount;
    const totalAmount = account.amount;

    let newStatus: typeof account.status = account.status;
    if (newPaidAmount >= totalAmount) {
      newStatus = "paid";
    } else if (newPaidAmount > 0) {
      newStatus = "partial";
    }

    // Update the financial account
    await this.updateFinancialAccount(payment.accountId, {
      paidAmount: newPaidAmount,
      status: newStatus,
      paidAt: newStatus === "paid" ? new Date() : undefined,
    });

    return createdPayment;
  }

  async getPaymentsByAccountId(accountId: string): Promise<Payment[]> {
    const paymentsList = await db
      .select()
      .from(payments)
      .where(eq(payments.accountId, accountId))
      .orderBy(desc(payments.paymentDate));

    return paymentsList;
  }

  async addPaymentToAccount(
    accountId: string,
    amount: number
  ): Promise<FinancialAccountFrontend> {
    // Get the current account
    const account = await this.getFinancialAccount(accountId);
    if (!account) {
      throw new Error("Account not found");
    }

    // Update paid amount
    const newPaidAmount = account.paidAmount + amount;
    return this.updateFinancialAccount(accountId, {
      paidAmount: newPaidAmount,
    });
  }

  async getOverdueAccounts(
    personalTrainerId: string
  ): Promise<FinancialAccountFrontend[]> {
    const accounts = await db
      .select()
      .from(financialAccounts)
      .where(
        and(
          eq(financialAccounts.personalTrainerId, personalTrainerId),
          eq(financialAccounts.status, "overdue")
        )
      );

    return accounts.map((account) => ({
      ...account,
      amount:
        typeof account.amount === "string"
          ? parseFloat(account.amount)
          : account.amount,
      paidAmount: account.paidAmount
        ? typeof account.paidAmount === "string"
          ? parseFloat(account.paidAmount)
          : account.paidAmount
        : 0,
    })) as FinancialAccountFrontend[];
  }

  async getStudentDebtSummary(studentId: string): Promise<any> {
    return { totalDebt: 0, overdueAmount: 0, accountsCount: 0 };
  }

  async getFinancialSummary(
    personalTrainerId: string,
    period: string
  ): Promise<any> {
    return { monthlyFlow: [], categoryBreakdown: [], studentDebts: [] };
  }

  async getPaymentByTransactionId(
    transactionId: string
  ): Promise<Payment | undefined> {
    return undefined;
  }

  async updatePaymentStatus(
    paymentId: string,
    updates: any
  ): Promise<Payment | undefined> {
    return undefined;
  }

  async getFinancialChartsData(
    personalTrainerId: string,
    period: string
  ): Promise<any> {
    return {
      incomeExpenseChart: [],
      categoryBreakdown: [],
      studentPaymentTrends: [],
    };
  }

  async getPaymentReports(
    personalTrainerId: string,
    filters: {
      startDate?: string;
      endDate?: string;
      studentId?: string;
      paymentMethod?: string;
      accountType?: "receivable" | "payable";
      status?: string;
      category?: string;
      minAmount?: number;
      maxAmount?: number;
    } = {},
    page: number = 1,
    limit: number = 50
  ): Promise<{
    payments: Array<{
      id: string;
      accountId: string;
      amount: number;
      paymentDate: Date;
      paymentMethod: string;
      transactionId?: string;
      account: {
        title: string;
        category: string;
        type: "receivable" | "payable";
        status: string;
        totalAmount: number;
      };
      student?: {
        id: string;
        name: string;
        email: string;
      };
    }>;
    totalCount: number;
    totalPages: number;
    summary: {
      totalAmount: number;
      averagePayment: number;
      paymentMethodBreakdown: { [key: string]: number };
      categoryBreakdown: { [key: string]: number };
    };
  }> {
    const offset = (page - 1) * limit;

    // Build the query with joins
    const baseQuery = db
      .select({
        paymentId: payments.id,
        paymentAccountId: payments.accountId,
        paymentAmount: payments.amount,
        paymentDate: payments.paymentDate,
        paymentMethod: payments.paymentMethod,
        transactionId: payments.transactionId,
        accountTitle: financialAccounts.title,
        accountCategory: financialAccounts.category,
        accountType: financialAccounts.type,
        accountStatus: financialAccounts.status,
        accountAmount: financialAccounts.amount,
        studentId: students.id,
        studentName: students.name,
        studentEmail: students.email,
      })
      .from(payments)
      .innerJoin(
        financialAccounts,
        eq(payments.accountId, financialAccounts.id)
      )
      .leftJoin(students, eq(financialAccounts.studentId, students.id));

    // Apply filters
    const conditions = [
      eq(financialAccounts.personalTrainerId, personalTrainerId),
    ];

    if (filters.startDate) {
      conditions.push(gte(payments.paymentDate, new Date(filters.startDate)));
    }
    if (filters.endDate) {
      // Add 1 day to include transactions on the end date
      const endDate = new Date(filters.endDate);
      endDate.setDate(endDate.getDate() + 1);
      conditions.push(lte(payments.paymentDate, endDate));
    }
    if (filters.studentId) {
      conditions.push(eq(financialAccounts.studentId, filters.studentId));
    }
    if (filters.paymentMethod) {
      conditions.push(eq(payments.paymentMethod, filters.paymentMethod));
    }
    if (filters.accountType) {
      conditions.push(eq(financialAccounts.type, filters.accountType));
    }
    if (filters.status) {
      conditions.push(eq(financialAccounts.status, filters.status as any));
    }
    if (filters.category) {
      conditions.push(
        eq(
          financialAccounts.category,
          filters.category as (typeof financialAccounts.category.enumValues)[number]
        )
      );
    }

    if (filters.minAmount) {
      conditions.push(
        gte(sql`CAST(${payments.amount} AS DECIMAL)`, filters.minAmount)
      );
    }
    if (filters.maxAmount) {
      conditions.push(
        lte(sql`CAST(${payments.amount} AS DECIMAL)`, filters.maxAmount)
      );
    }

    const query =
      conditions.length > 0
        ? baseQuery.where(and(...conditions))
        : baseQuery.where(
            eq(financialAccounts.personalTrainerId, personalTrainerId)
          );

    // Get total count
    const countQuery = db
      .select({ count: sql`count(*)` })
      .from(payments)
      .innerJoin(
        financialAccounts,
        eq(payments.accountId, financialAccounts.id)
      );

    if (conditions.length > 0) {
      countQuery.where(and(...conditions));
    }

    const [{ count }] = await countQuery;
    const totalCount = Number(count);
    const totalPages = Math.ceil(totalCount / limit);

    // Get paginated results
    const results = await query
      .orderBy(desc(payments.paymentDate))
      .limit(limit)
      .offset(offset);

    // Transform results
    const paymentsData = results.map((row) => {
      const payment: any = {
        id: row.paymentId,
        accountId: row.paymentAccountId,
        amount: parseFloat(row.paymentAmount),
        paymentDate: row.paymentDate || new Date(),
        paymentMethod: row.paymentMethod || "",
        transactionId: row.transactionId || undefined,
        account: {
          title: row.accountTitle,
          category: row.accountCategory as string,
          type: row.accountType as "receivable" | "payable",
          status: row.accountStatus as string,
          totalAmount: parseFloat(row.accountAmount),
        },
      };

      if (row.studentId) {
        payment.student = {
          id: row.studentId,
          name: row.studentName,
          email: row.studentEmail,
        };
      }

      return payment;
    });

    // Calculate summary statistics
    const totalAmount = paymentsData.reduce(
      (sum, payment) => sum + payment.amount,
      0
    );
    const averagePayment =
      paymentsData.length > 0 ? totalAmount / paymentsData.length : 0;

    const paymentMethodBreakdown: { [key: string]: number } = {};
    const categoryBreakdown: { [key: string]: number } = {};

    paymentsData.forEach((payment) => {
      // Payment method breakdown
      if (payment.paymentMethod) {
        paymentMethodBreakdown[payment.paymentMethod] =
          (paymentMethodBreakdown[payment.paymentMethod] || 0) + payment.amount;
      }

      // Category breakdown
      if (payment.account.category) {
        categoryBreakdown[payment.account.category] =
          (categoryBreakdown[payment.account.category] || 0) + payment.amount;
      }
    });

    return {
      payments: paymentsData,
      totalCount,
      totalPages,
      summary: {
        totalAmount,
        averagePayment,
        paymentMethodBreakdown,
        categoryBreakdown,
      },
    };
  }

  // ==================== POSTURE ASSESSMENT METHODS ====================

  async createPostureAssessment(data: InsertPostureAssessment) {
    const [assessment] = await db
      .insert(postureAssessments)
      .values(data)
      .returning();
    return assessment;
  }

  async getPostureAssessment(id: string) {
    const [assessment] = await db
      .select()
      .from(postureAssessments)
      .where(eq(postureAssessments.id, id));
    return assessment;
  }

  async getPostureAssessmentsByStudent(studentId: string) {
    return await db
      .select()
      .from(postureAssessments)
      .where(eq(postureAssessments.studentId, studentId))
      .orderBy(desc(postureAssessments.createdAt));
  }

  async updatePostureAssessment(
    id: string,
    data: Partial<InsertPostureAssessment>
  ) {
    const [assessment] = await db
      .update(postureAssessments)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(postureAssessments.id, id))
      .returning();
    return assessment;
  }

  async deletePostureAssessment(id: string) {
    await db.delete(postureAssessments).where(eq(postureAssessments.id, id));
  }

  async createPosturePhoto(data: InsertPosturePhoto) {
    const [photo] = await db.insert(posturePhotos).values(data).returning();
    return photo;
  }

  async getPosturePhotos(assessmentId: string) {
    return await db
      .select()
      .from(posturePhotos)
      .where(eq(posturePhotos.assessmentId, assessmentId))
      .orderBy(asc(posturePhotos.photoType));
  }

  async deletePosturePhoto(id: string) {
    await db.delete(posturePhotos).where(eq(posturePhotos.id, id));
  }

  async createPostureObservation(data: InsertPostureObservation) {
    const [observation] = await db
      .insert(postureObservations)
      .values(data)
      .returning();
    return observation;
  }

  async getPostureObservations(assessmentId: string) {
    return await db
      .select()
      .from(postureObservations)
      .where(eq(postureObservations.assessmentId, assessmentId))
      .orderBy(asc(postureObservations.joint));
  }

  async deletePostureObservation(id: string) {
    await db.delete(postureObservations).where(eq(postureObservations.id, id));
  }

  async createPostureOption(data: InsertPostureOption) {
    const [option] = await db.insert(postureOptions).values(data).returning();
    return option;
  }

  async getPostureOptionsByJoint(joint: string) {
    return await db
      .select()
      .from(postureOptions)
      .where(
        and(
          eq(
            postureOptions.joint,
            joint as (typeof postureOptions.joint.enumValues)[number]
          ),
          eq(postureOptions.isActive, true)
        )
      )
      .orderBy(asc(postureOptions.optionText));
  }

  async getAllPostureOptions() {
    return await db
      .select()
      .from(postureOptions)
      .where(eq(postureOptions.isActive, true))
      .orderBy(asc(postureOptions.joint), asc(postureOptions.optionText));
  }
}

export const storage = new DatabaseStorage();
