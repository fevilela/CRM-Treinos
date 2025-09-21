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
  calendarEvents,
  assessmentPhotos,
  financialAccounts,
  payments,
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
  type InsertPayment,
  type Payment,
  type InsertPhysicalAssessment,
  type PhysicalAssessment,
} from "@shared/schema";
import { eq, desc, asc, and, or, gte, lte, sql, ne } from "drizzle-orm";
import { promises as fs } from "fs";
import path from "path";

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
  createStudent(student: InsertStudent): Promise<Student>;
  updateStudent(id: string, student: Partial<InsertStudent>): Promise<Student>;
  deleteStudent(id: string): Promise<void>;

  // Workout operations
  getWorkouts(personalTrainerId: string): Promise<Workout[]>;
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

  // Body evolution tracking
  getEvolutionPhotos(studentId: string): Promise<AssessmentPhoto[]>;
  createEvolutionPhoto(photo: InsertAssessmentPhoto): Promise<AssessmentPhoto>;

  // Physical assessment operations
  getStudentAssessments(studentId: string): Promise<PhysicalAssessment[]>;
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
  ): Promise<FinancialAccount[]>;
  getFinancialAccount(id: string): Promise<FinancialAccount | undefined>;
  createFinancialAccount(
    account: InsertFinancialAccount
  ): Promise<FinancialAccount>;
  updateFinancialAccount(
    id: string,
    account: Partial<InsertFinancialAccount>
  ): Promise<FinancialAccount>;
  deleteFinancialAccount(id: string): Promise<void>;

  // Payment operations
  getPayments(accountId: string): Promise<Payment[]>;
  createPayment(payment: InsertPayment): Promise<Payment>;
  getPaymentsByAccountId(accountId: string): Promise<Payment[]>;
  addPaymentToAccount(
    accountId: string,
    amount: number
  ): Promise<FinancialAccount>;

  // Financial reporting
  getOverdueAccounts(personalTrainerId: string): Promise<FinancialAccount[]>;
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
  getStudentCharges(studentId: string): Promise<FinancialAccount[]>;

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
  async getStudentCharges(studentId: string): Promise<FinancialAccount[]> {
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
    })) as any;
  }

  // Placeholder methods for remaining operations - simplified to get server running
  async getWorkouts(personalTrainerId: string): Promise<Workout[]> {
    return [];
  }
  async getStudentWorkouts(studentId: string): Promise<Workout[]> {
    return [];
  }
  async getWorkout(id: string): Promise<Workout | undefined> {
    return undefined;
  }
  async createWorkout(workout: InsertWorkout): Promise<Workout> {
    return {} as Workout;
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
    return [];
  }
  async createExerciseTemplate(
    template: InsertExerciseTemplate
  ): Promise<ExerciseTemplate> {
    return {} as ExerciseTemplate;
  }
  async searchExerciseTemplates(query: string): Promise<ExerciseTemplate[]> {
    return [];
  }
  async getWorkoutExercises(workoutId: string): Promise<Exercise[]> {
    return [];
  }
  async createExercise(exercise: InsertExercise): Promise<Exercise> {
    return {} as Exercise;
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
    return {} as ExercisePerformance;
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
    return [];
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
  async getFinancialAccounts(
    personalTrainerId: string,
    filters?: any
  ): Promise<FinancialAccount[]> {
    return [];
  }
  async getFinancialAccount(id: string): Promise<FinancialAccount | undefined> {
    return undefined;
  }
  async createFinancialAccount(
    account: InsertFinancialAccount
  ): Promise<FinancialAccount> {
    return {} as FinancialAccount;
  }
  async updateFinancialAccount(
    id: string,
    account: Partial<InsertFinancialAccount>
  ): Promise<FinancialAccount> {
    return {} as FinancialAccount;
  }
  async deleteFinancialAccount(id: string): Promise<void> {}
  async getPayments(accountId: string): Promise<Payment[]> {
    return [];
  }
  async createPayment(payment: InsertPayment): Promise<Payment> {
    return {} as Payment;
  }
  async getPaymentsByAccountId(accountId: string): Promise<Payment[]> {
    return [];
  }
  async addPaymentToAccount(
    accountId: string,
    amount: number
  ): Promise<FinancialAccount> {
    return {} as FinancialAccount;
  }
  async getOverdueAccounts(
    personalTrainerId: string
  ): Promise<FinancialAccount[]> {
    return [];
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
}

export const storage = new DatabaseStorage();
