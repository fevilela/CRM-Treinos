import { z } from "zod";
import {
  users,
  students,
  workouts,
  exercises,
  exerciseTemplates,
  workoutSessions,
  exercisePerformances,
  bodyMeasurements,
  workoutHistory,
  workoutComments,
  physicalAssessments,
  physicalAssessmentHistory,
  assessmentPhotos,
  calendarEvents,
  financialAccounts,
  payments,
  type User,
  type InsertUser,
  type UpsertUser,
  type Student,
  type InsertStudent,
  type Workout,
  type InsertWorkout,
  type Exercise,
  type InsertExercise,
  type ExerciseTemplate,
  type InsertExerciseTemplate,
  type WorkoutSession,
  type InsertWorkoutSession,
  type ExercisePerformance,
  type InsertExercisePerformance,
  type BodyMeasurement,
  type InsertBodyMeasurement,
  type WorkoutHistory,
  type InsertWorkoutHistory,
  type WorkoutComment,
  type InsertWorkoutComment,
  type PhysicalAssessment,
  type InsertPhysicalAssessment,
  type PhysicalAssessmentHistory,
  type InsertPhysicalAssessmentHistory,
  type AssessmentPhoto,
  type InsertAssessmentPhoto,
  type CalendarEvent,
  type InsertCalendarEvent,
  type FinancialAccount,
  type InsertFinancialAccount,
  type Payment,
  type InsertPayment,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, sql, count, gte, lte } from "drizzle-orm";
import PDFDocument from "pdfkit";
import type * as PDFKit from "pdfkit";
import { analyzePhysicalAssessment } from "./analysisEngine";

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
    activeWorkouts: number;
    adherenceRate: number;
    todaySessions: number;
  }>;

  // Workout history operations (for progress tracking)
  getWorkoutHistory(
    studentId: string,
    exerciseId?: string
  ): Promise<WorkoutHistory[]>;
  createWorkoutHistory(history: InsertWorkoutHistory): Promise<WorkoutHistory>;
  getExerciseProgress(
    studentId: string,
    exerciseId: string
  ): Promise<WorkoutHistory[]>;

  // Student authentication
  getStudentByEmail(email: string): Promise<Student | undefined>;
  validateStudentPassword(
    email: string,
    password: string
  ): Promise<Student | null>;
  getStudentByInviteToken(token: string): Promise<Student | undefined>;
  updateStudentPassword(id: string, hashedPassword: string): Promise<Student>;

  // Workout comments operations
  getWorkoutComments(workoutSessionId: string): Promise<WorkoutComment[]>;
  createWorkoutComment(comment: InsertWorkoutComment): Promise<WorkoutComment>;
  updateWorkoutComment(
    id: string,
    comment: Partial<InsertWorkoutComment>
  ): Promise<WorkoutComment>;
  deleteWorkoutComment(id: string): Promise<void>;

  // Physical assessment operations
  getPhysicalAssessments(
    personalTrainerId: string
  ): Promise<PhysicalAssessment[]>;
  getStudentPhysicalAssessments(
    studentId: string
  ): Promise<PhysicalAssessment[]>;
  getPhysicalAssessment(id: string): Promise<PhysicalAssessment | undefined>;
  createPhysicalAssessment(
    assessment: InsertPhysicalAssessment
  ): Promise<PhysicalAssessment>;
  updatePhysicalAssessment(
    id: string,
    assessment: Partial<InsertPhysicalAssessment>
  ): Promise<PhysicalAssessment>;
  deletePhysicalAssessment(id: string): Promise<void>;
  getPhysicalAssessmentHistory(
    assessmentId: string
  ): Promise<PhysicalAssessmentHistory[]>;
  getStudentAssessmentHistory(
    studentId: string
  ): Promise<PhysicalAssessmentHistory[]>;

  // Assessment photo operations
  getAssessmentPhotos(assessmentId: string): Promise<AssessmentPhoto[]>;
  getAssessmentPhoto(photoId: string): Promise<AssessmentPhoto | undefined>;
  createAssessmentPhoto(photo: InsertAssessmentPhoto): Promise<AssessmentPhoto>;
  deleteAssessmentPhoto(photoId: string): Promise<void>;

  // Calendar events operations
  getCalendarEvents(personalTrainerId: string): Promise<CalendarEvent[]>;
  getStudentCalendarEvents(studentId: string): Promise<CalendarEvent[]>;
  getCalendarEvent(id: string): Promise<CalendarEvent | undefined>;
  createCalendarEvent(event: InsertCalendarEvent): Promise<CalendarEvent>;
  updateCalendarEvent(
    id: string,
    event: Partial<InsertCalendarEvent>
  ): Promise<CalendarEvent>;
  deleteCalendarEvent(id: string): Promise<void>;
  getUpcomingEvents(startDate: Date, endDate: Date): Promise<CalendarEvent[]>;
  markEventReminderSent(eventId: string): Promise<void>;

  // Financial operations
  getFinancialAccounts(
    personalTrainerId: string,
    filters?: {
      type?: string;
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
  getPaymentsByAccountId(accountId: string): Promise<Payment[]>;
  createPayment(payment: InsertPayment): Promise<Payment>;
  updateAccountAfterPayment(accountId: string): Promise<FinancialAccount>;
  getOverdueAccounts(personalTrainerId: string): Promise<FinancialAccount[]>;
  getStudentDebtSummary(studentId: string): Promise<{
    totalDebt: number;
    overdueAmount: number;
    accountsCount: number;
    lastPaymentDate?: Date;
  }>;
  getFinancialDashboard(personalTrainerId: string): Promise<{
    totalReceivable: number;
    totalPayable: number;
    totalOverdue: number;
    monthlyIncome: number;
    monthlyExpenses: number;
    netIncome: number;
    pendingPayments: number;
  }>;
  getFinancialChartsData(
    personalTrainerId: string,
    period: string
  ): Promise<{
    monthlyFlow: Array<{ month: string; income: number; expenses: number }>;
    categoryBreakdown: Array<{ category: string; amount: number }>;
    studentDebts: Array<{ studentName: string; debt: number }>;
  }>;
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
    return newStudent;
  }

  async updateStudent(
    id: string,
    studentData: Partial<InsertStudent>
  ): Promise<Student> {
    const updateData = {
      ...studentData,
      weight: studentData.weight?.toString() || null,
      height: studentData.height?.toString() || null,
      updatedAt: new Date(),
    };
    const [updatedStudent] = await db
      .update(students)
      .set(updateData)
      .where(eq(students.id, id))
      .returning();
    return updatedStudent;
  }

  async deleteStudent(id: string): Promise<void> {
    await db.delete(students).where(eq(students.id, id));
  }

  // Workout operations
  async getWorkouts(personalTrainerId: string): Promise<Workout[]> {
    const workoutsData = await db
      .select()
      .from(workouts)
      .where(eq(workouts.personalTrainerId, personalTrainerId))
      .orderBy(desc(workouts.createdAt));

    // For each workout, fetch its exercises
    const workoutsWithExercises = await Promise.all(
      workoutsData.map(async (workout) => {
        const exercises = await this.getWorkoutExercises(workout.id);
        return {
          ...workout,
          exercises,
        };
      })
    );

    return workoutsWithExercises as any;
  }

  async getStudentWorkouts(studentId: string): Promise<Workout[]> {
    const workoutsData = await db
      .select()
      .from(workouts)
      .where(eq(workouts.studentId, studentId))
      .orderBy(desc(workouts.createdAt));

    // Para cada treino, buscar seus exercícios (igual ao getWorkouts)
    const workoutsWithExercises = await Promise.all(
      workoutsData.map(async (workout) => {
        const exercises = await this.getWorkoutExercises(workout.id);
        return {
          ...workout,
          exercises,
        };
      })
    );

    return workoutsWithExercises as any;
  }

  async getWorkout(id: string): Promise<Workout | undefined> {
    const [workout] = await db
      .select()
      .from(workouts)
      .where(eq(workouts.id, id));
    return workout;
  }

  async getStudentMostRecentWorkout(
    studentId: string
  ): Promise<Workout | undefined> {
    const [workout] = await db
      .select()
      .from(workouts)
      .where(eq(workouts.studentId, studentId))
      .orderBy(desc(workouts.createdAt))
      .limit(1);
    return workout;
  }

  // Helper method to get next weekday in sequence
  private getNextWeekday(currentWeekday: string | null): string {
    const weekdays = [
      "monday",
      "tuesday",
      "wednesday",
      "thursday",
      "friday",
      "saturday",
      "sunday",
    ];

    if (!currentWeekday) {
      return "monday"; // Start with Monday if no previous workout
    }

    const currentIndex = weekdays.indexOf(currentWeekday);
    const nextIndex = (currentIndex + 1) % weekdays.length; // Wrap around after Sunday
    return weekdays[nextIndex];
  }

  async createWorkout(workout: InsertWorkout): Promise<Workout> {
    // If no weekday is specified, automatically assign one
    if (!workout.weekday && workout.studentId) {
      const mostRecentWorkout = await this.getStudentMostRecentWorkout(
        workout.studentId
      );
      workout.weekday = this.getNextWeekday(
        mostRecentWorkout?.weekday || null
      ) as any;
    }

    const [newWorkout] = await db.insert(workouts).values(workout).returning();
    return newWorkout;
  }

  async updateWorkout(
    id: string,
    workoutData: Partial<InsertWorkout>
  ): Promise<Workout> {
    // If no weekday is specified in the update, automatically assign one
    if (workoutData.weekday === undefined || workoutData.weekday === null) {
      // First get the existing workout to obtain the studentId
      const existingWorkout = await this.getWorkout(id);
      if (existingWorkout && existingWorkout.studentId) {
        const studentId = workoutData.studentId || existingWorkout.studentId;
        const mostRecentWorkout = await this.getStudentMostRecentWorkout(
          studentId
        );
        workoutData.weekday = this.getNextWeekday(
          mostRecentWorkout?.weekday || null
        ) as any;
      }
    }

    const [updatedWorkout] = await db
      .update(workouts)
      .set({ ...workoutData, updatedAt: new Date() })
      .where(eq(workouts.id, id))
      .returning();
    return updatedWorkout;
  }

  async deleteWorkout(id: string): Promise<void> {
    await db.delete(workouts).where(eq(workouts.id, id));
  }

  // Exercise template operations
  async getExerciseTemplates(): Promise<ExerciseTemplate[]> {
    return await db
      .select()
      .from(exerciseTemplates)
      .orderBy(exerciseTemplates.name);
  }

  async createExerciseTemplate(
    template: InsertExerciseTemplate
  ): Promise<ExerciseTemplate> {
    const [newTemplate] = await db
      .insert(exerciseTemplates)
      .values(template)
      .returning();
    return newTemplate;
  }

  async searchExerciseTemplates(query: string): Promise<ExerciseTemplate[]> {
    return await db
      .select()
      .from(exerciseTemplates)
      .where(sql`${exerciseTemplates.name} ILIKE ${`%${query}%`}`)
      .orderBy(exerciseTemplates.name);
  }

  // Exercise operations
  async getWorkoutExercises(workoutId: string): Promise<Exercise[]> {
    const exerciseData = await db
      .select()
      .from(exercises)
      .where(eq(exercises.workoutId, workoutId))
      .orderBy(exercises.order);

    // Convert weight from string to number for frontend
    return exerciseData.map(
      (exercise) =>
        ({
          ...exercise,
          weight: exercise.weight
            ? parseFloat(exercise.weight as string)
            : null,
        } as any)
    );
  }

  async createExercise(exercise: InsertExercise): Promise<Exercise> {
    const exerciseData = {
      ...exercise,
      weight: exercise.weight?.toString() || null,
    };
    const [newExercise] = await db
      .insert(exercises)
      .values(exerciseData)
      .returning();
    return newExercise;
  }

  async updateExercise(
    id: string,
    exerciseData: Partial<InsertExercise>
  ): Promise<Exercise> {
    const updateData = {
      ...exerciseData,
      weight: exerciseData.weight?.toString() || null,
    };
    const [updatedExercise] = await db
      .update(exercises)
      .set(updateData)
      .where(eq(exercises.id, id))
      .returning();
    return updatedExercise;
  }

  async deleteExercise(id: string): Promise<void> {
    await db.delete(exercises).where(eq(exercises.id, id));
  }

  async deleteWorkoutExercises(workoutId: string): Promise<void> {
    await db.delete(exercises).where(eq(exercises.workoutId, workoutId));
  }

  // Workout session operations
  async getWorkoutSessions(studentId: string): Promise<WorkoutSession[]> {
    return await db
      .select()
      .from(workoutSessions)
      .where(eq(workoutSessions.studentId, studentId))
      .orderBy(desc(workoutSessions.completedAt));
  }

  async createWorkoutSession(
    session: InsertWorkoutSession
  ): Promise<WorkoutSession> {
    const [newSession] = await db
      .insert(workoutSessions)
      .values(session)
      .returning();
    return newSession;
  }

  async getRecentSessions(
    personalTrainerId: string,
    limit = 10
  ): Promise<WorkoutSession[]> {
    return await db
      .select({
        id: workoutSessions.id,
        studentId: workoutSessions.studentId,
        workoutId: workoutSessions.workoutId,
        notes: workoutSessions.notes,
        startTime: workoutSessions.startTime,
        completedAt: workoutSessions.completedAt,
        duration: workoutSessions.duration,
      })
      .from(workoutSessions)
      .innerJoin(workouts, eq(workoutSessions.workoutId, workouts.id))
      .where(eq(workouts.personalTrainerId, personalTrainerId))
      .orderBy(desc(workoutSessions.completedAt))
      .limit(limit);
  }

  // Exercise performance operations
  async getSessionPerformances(
    sessionId: string
  ): Promise<ExercisePerformance[]> {
    return await db
      .select()
      .from(exercisePerformances)
      .where(eq(exercisePerformances.workoutSessionId, sessionId));
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

  // Body measurement operations
  async getStudentMeasurements(studentId: string): Promise<BodyMeasurement[]> {
    return await db
      .select()
      .from(bodyMeasurements)
      .where(eq(bodyMeasurements.studentId, studentId))
      .orderBy(desc(bodyMeasurements.measuredAt));
  }

  async createBodyMeasurement(
    measurement: InsertBodyMeasurement
  ): Promise<BodyMeasurement> {
    const [newMeasurement] = await db
      .insert(bodyMeasurements)
      .values(measurement)
      .returning();
    return newMeasurement;
  }

  // Dashboard statistics
  async getDashboardStats(personalTrainerId: string): Promise<{
    totalStudents: number;
    activeWorkouts: number;
    adherenceRate: number;
    todaySessions: number;
  }> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Total students
    const totalStudentsResult = await db
      .select({ count: count() })
      .from(students)
      .where(
        and(
          eq(students.personalTrainerId, personalTrainerId),
          eq(students.status, "active")
        )
      );

    // Active workouts
    const activeWorkoutsResult = await db
      .select({ count: count() })
      .from(workouts)
      .where(
        and(
          eq(workouts.personalTrainerId, personalTrainerId),
          eq(workouts.isActive, true)
        )
      );

    // Today's sessions
    const todaySessionsResult = await db
      .select({ count: count() })
      .from(workoutSessions)
      .innerJoin(workouts, eq(workoutSessions.workoutId, workouts.id))
      .where(
        and(
          eq(workouts.personalTrainerId, personalTrainerId),
          sql`${workoutSessions.completedAt} >= ${today}`,
          sql`${workoutSessions.completedAt} < ${tomorrow}`
        )
      );

    // Calculate adherence rate (simplified - sessions completed vs expected)
    const totalSessions = await db
      .select({ count: count() })
      .from(workoutSessions)
      .innerJoin(workouts, eq(workoutSessions.workoutId, workouts.id))
      .where(eq(workouts.personalTrainerId, personalTrainerId));

    const activeStudents = totalStudentsResult[0]?.count || 0;
    const totalSessionsCount = totalSessions[0]?.count || 0;

    // Simple adherence calculation - assuming 3 sessions per week per student
    const expectedSessions = activeStudents * 3 * 4; // 3 sessions/week * 4 weeks
    const adherenceRate =
      expectedSessions > 0
        ? Math.round((totalSessionsCount / expectedSessions) * 100)
        : 0;

    return {
      totalStudents: activeStudents,
      activeWorkouts: activeWorkoutsResult[0]?.count || 0,
      adherenceRate: Math.min(adherenceRate, 100), // Cap at 100%
      todaySessions: todaySessionsResult[0]?.count || 0,
    };
  }

  // Workout history operations (for progress tracking)
  async getWorkoutHistory(
    studentId: string,
    exerciseId?: string
  ): Promise<WorkoutHistory[]> {
    if (exerciseId) {
      return await db
        .select()
        .from(workoutHistory)
        .where(
          and(
            eq(workoutHistory.studentId, studentId),
            eq(workoutHistory.exerciseId, exerciseId)
          )
        )
        .orderBy(desc(workoutHistory.completedAt));
    }

    return await db
      .select()
      .from(workoutHistory)
      .where(eq(workoutHistory.studentId, studentId))
      .orderBy(desc(workoutHistory.completedAt));
  }

  async createWorkoutHistory(
    history: InsertWorkoutHistory
  ): Promise<WorkoutHistory> {
    const [newHistory] = await db
      .insert(workoutHistory)
      .values({
        studentId: history.studentId,
        exerciseId: history.exerciseId,
        exerciseName: history.exerciseName,
        sets: history.sets,
        reps: history.reps,
        weight: history.weight || "0",
        previousWeight: history.previousWeight,
        comments: history.comments,
        workoutSessionId: history.workoutSessionId,
      })
      .returning();
    return newHistory;
  }

  async getExerciseProgress(
    studentId: string,
    exerciseId: string
  ): Promise<WorkoutHistory[]> {
    return await db
      .select()
      .from(workoutHistory)
      .where(
        and(
          eq(workoutHistory.studentId, studentId),
          eq(workoutHistory.exerciseId, exerciseId)
        )
      )
      .orderBy(desc(workoutHistory.completedAt))
      .limit(10); // Últimos 10 registros
  }

  // Student authentication
  async getStudentByEmail(email: string): Promise<Student | undefined> {
    const [student] = await db
      .select()
      .from(students)
      .where(eq(students.email, email));
    return student;
  }

  async validateStudentPassword(
    email: string,
    password: string
  ): Promise<Student | null> {
    const student = await this.getStudentByEmail(email);
    if (student && student.password) {
      const bcrypt = await import("bcrypt");
      const isPasswordValid = await bcrypt.compare(password, student.password);
      if (isPasswordValid) {
        return student;
      }
    }
    return null;
  }

  async getStudentByInviteToken(token: string): Promise<Student | undefined> {
    const [student] = await db
      .select()
      .from(students)
      .where(eq(students.inviteToken, token));
    if (!student) return student;

    // Convert decimal strings back to numbers for frontend
    return {
      ...student,
      weight: student.weight ? parseFloat(student.weight as string) : null,
      height: student.height ? parseFloat(student.height as string) : null,
    } as any;
  }

  async updateStudentPassword(
    id: string,
    hashedPassword: string
  ): Promise<Student> {
    const [student] = await db
      .update(students)
      .set({
        password: hashedPassword,
        isInvitePending: false,
        inviteToken: null,
        updatedAt: new Date(),
      })
      .where(eq(students.id, id))
      .returning();

    // Convert decimal strings back to numbers for frontend
    return {
      ...student,
      weight: student.weight ? parseFloat(student.weight as string) : null,
      height: student.height ? parseFloat(student.height as string) : null,
    } as any;
  }

  // Workout comments operations
  async getWorkoutComments(
    workoutSessionId: string
  ): Promise<WorkoutComment[]> {
    return await db
      .select()
      .from(workoutComments)
      .where(eq(workoutComments.workoutSessionId, workoutSessionId))
      .orderBy(desc(workoutComments.createdAt));
  }

  async createWorkoutComment(
    comment: InsertWorkoutComment
  ): Promise<WorkoutComment> {
    const [newComment] = await db
      .insert(workoutComments)
      .values(comment)
      .returning();
    return newComment;
  }

  async updateWorkoutComment(
    id: string,
    comment: Partial<InsertWorkoutComment>
  ): Promise<WorkoutComment> {
    const [updatedComment] = await db
      .update(workoutComments)
      .set(comment)
      .where(eq(workoutComments.id, id))
      .returning();
    return updatedComment;
  }

  async deleteWorkoutComment(id: string): Promise<void> {
    await db.delete(workoutComments).where(eq(workoutComments.id, id));
  }

  // Physical assessment operations
  async getPhysicalAssessments(
    personalTrainerId: string
  ): Promise<PhysicalAssessment[]> {
    return await db
      .select()
      .from(physicalAssessments)
      .where(eq(physicalAssessments.personalTrainerId, personalTrainerId))
      .orderBy(desc(physicalAssessments.assessmentDate));
  }

  async getStudentPhysicalAssessments(
    studentId: string
  ): Promise<PhysicalAssessment[]> {
    return await db
      .select()
      .from(physicalAssessments)
      .where(eq(physicalAssessments.studentId, studentId))
      .orderBy(desc(physicalAssessments.assessmentDate));
  }

  async getPhysicalAssessment(
    id: string
  ): Promise<PhysicalAssessment | undefined> {
    const [assessment] = await db
      .select()
      .from(physicalAssessments)
      .where(eq(physicalAssessments.id, id));
    return assessment;
  }

  async createPhysicalAssessment(
    assessment: InsertPhysicalAssessment
  ): Promise<PhysicalAssessment> {
    // Remove fields that don't exist in database schema and handle assessmentDate
    const {
      nutritionHabits,
      substanceUse,
      assessmentDate,
      ...validAssessment
    } = assessment as any;

    // Process assessmentDate - convert ISO string to Date object
    const processedAssessmentDate = assessmentDate
      ? new Date(assessmentDate)
      : undefined;

    // Convert numeric fields to strings for database storage
    const dataForInsert = {
      ...validAssessment,
      assessmentDate: processedAssessmentDate,
      currentWeight: validAssessment.currentWeight?.toString(),
      currentHeight: validAssessment.currentHeight?.toString(),
      bmi: validAssessment.bmi?.toString(),

      // Circunferências
      chestCirc: validAssessment.chestCirc?.toString(),
      rightArmContractedCirc:
        validAssessment.rightArmContractedCirc?.toString(),
      rightArmRelaxedCirc: validAssessment.rightArmRelaxedCirc?.toString(),
      leftArmContractedCirc: validAssessment.leftArmContractedCirc?.toString(),
      leftArmRelaxedCirc: validAssessment.leftArmRelaxedCirc?.toString(),
      waistCirc: validAssessment.waistCirc?.toString(),
      hipCirc: validAssessment.hipCirc?.toString(),
      rightThighCirc: validAssessment.rightThighCirc?.toString(),
      leftThighCirc: validAssessment.leftThighCirc?.toString(),
      rightCalfCirc: validAssessment.rightCalfCirc?.toString(),
      leftCalfCirc: validAssessment.leftCalfCirc?.toString(),

      // RCQ
      waistHipRatio: validAssessment.waistHipRatio?.toString(),

      // Dobras cutâneas
      tricepsSkinFold: validAssessment.tricepsSkinFold?.toString(),
      subscapularSkinFold: validAssessment.subscapularSkinFold?.toString(),
      midAxillarySkinFold: validAssessment.midAxillarySkinFold?.toString(),
      pectoralSkinFold: validAssessment.pectoralSkinFold?.toString(),
      suprailiacSkinFold: validAssessment.suprailiacSkinFold?.toString(),
      abdominalSkinFold: validAssessment.abdominalSkinFold?.toString(),
      thighSkinFold: validAssessment.thighSkinFold?.toString(),

      // Composição corporal
      bodyFatPercentage: validAssessment.bodyFatPercentage?.toString(),
      fatMass: validAssessment.fatMass?.toString(),
      leanMass: validAssessment.leanMass?.toString(),
      bodyWater: validAssessment.bodyWater?.toString(),
      oxygenSaturation: validAssessment.oxygenSaturation?.toString(),
    };

    const [newAssessment] = await db
      .insert(physicalAssessments)
      .values(dataForInsert)
      .returning();
    return newAssessment;
  }

  async updatePhysicalAssessment(
    id: string,
    assessment: Partial<InsertPhysicalAssessment>
  ): Promise<PhysicalAssessment> {
    console.log("🔄 Iniciando atualização da avaliação física:", id);

    // Start atomic transaction to ensure data consistency
    return await db.transaction(async (tx) => {
      // First, get the current assessment to save to history
      const [currentAssessment] = await tx
        .select()
        .from(physicalAssessments)
        .where(eq(physicalAssessments.id, id));

      if (!currentAssessment) {
        throw new Error("Assessment not found");
      }

      console.log("📊 Avaliação atual encontrada, salvando no histórico...");

      // Get the next version number for this assessment's history
      const historyCount = await tx
        .select({ count: count() })
        .from(physicalAssessmentHistory)
        .where(eq(physicalAssessmentHistory.originalAssessmentId, id));

      const nextVersion = (historyCount[0]?.count || 0) + 1;
      console.log("📈 Versão do histórico:", nextVersion);

      // CRITICAL FIX: Convert values to strings for history table schema
      const historyData = {
        originalAssessmentId: id,
        studentId: currentAssessment.studentId,
        personalTrainerId: currentAssessment.personalTrainerId,
        versionNumber: nextVersion,

        // Convert based on schema types: decimal→string, text→string, real→number
        currentWeight: currentAssessment.currentWeight?.toString() || null,
        currentHeight: currentAssessment.currentHeight?.toString() || null,
        bmi: currentAssessment.bmi?.toString() || null,
        waistCirc: currentAssessment.waistCirc?.toString() || null,
        hipCirc: currentAssessment.hipCirc?.toString() || null,
        chestCirc: currentAssessment.chestCirc?.toString() || null,
        bodyFatPercentage: currentAssessment.bodyFatPercentage
          ? parseFloat(currentAssessment.bodyFatPercentage.toString())
          : null,
        leanMass: currentAssessment.leanMass
          ? parseFloat(currentAssessment.leanMass.toString())
          : null,
        assessmentDate: currentAssessment.assessmentDate,
      };

      console.log("💾 Inserindo no histórico (transação):", historyData);
      await tx.insert(physicalAssessmentHistory).values([historyData]);
      console.log("✅ Histórico salvo com sucesso na transação!");

      // Now update the current assessment with new data
      const {
        nutritionHabits,
        substanceUse,
        assessmentDate,
        ...validAssessment
      } = assessment as any;

      // Process assessmentDate - convert ISO string to Date object
      const processedAssessmentDate = assessmentDate
        ? new Date(assessmentDate)
        : undefined;

      const assessmentData = {
        ...validAssessment,
        assessmentDate: processedAssessmentDate,
        currentWeight: validAssessment.currentWeight?.toString(),
        currentHeight: validAssessment.currentHeight?.toString(),
        bmi: validAssessment.bmi?.toString(),

        // Circunferências
        chestCirc: validAssessment.chestCirc?.toString(),
        rightArmContractedCirc:
          validAssessment.rightArmContractedCirc?.toString(),
        rightArmRelaxedCirc: validAssessment.rightArmRelaxedCirc?.toString(),
        leftArmContractedCirc:
          validAssessment.leftArmContractedCirc?.toString(),
        leftArmRelaxedCirc: validAssessment.leftArmRelaxedCirc?.toString(),
        waistCirc: validAssessment.waistCirc?.toString(),
        hipCirc: validAssessment.hipCirc?.toString(),
        rightThighCirc: validAssessment.rightThighCirc?.toString(),
        leftThighCirc: validAssessment.leftThighCirc?.toString(),
        rightCalfCirc: validAssessment.rightCalfCirc?.toString(),
        leftCalfCirc: validAssessment.leftCalfCirc?.toString(),

        // RCQ
        waistHipRatio: validAssessment.waistHipRatio?.toString(),

        // Dobras cutâneas
        tricepsSkinFold: validAssessment.tricepsSkinFold?.toString(),
        subscapularSkinFold: validAssessment.subscapularSkinFold?.toString(),
        midAxillarySkinFold: validAssessment.midAxillarySkinFold?.toString(),
        pectoralSkinFold: validAssessment.pectoralSkinFold?.toString(),
        suprailiacSkinFold: validAssessment.suprailiacSkinFold?.toString(),
        abdominalSkinFold: validAssessment.abdominalSkinFold?.toString(),
        thighSkinFold: validAssessment.thighSkinFold?.toString(),

        // Composição corporal
        bodyFatPercentage: validAssessment.bodyFatPercentage?.toString(),
        fatMass: validAssessment.fatMass?.toString(),
        leanMass: validAssessment.leanMass?.toString(),
        bodyWater: validAssessment.bodyWater?.toString(),
        oxygenSaturation: validAssessment.oxygenSaturation?.toString(),
        updatedAt: new Date(),
      };

      console.log("🔄 Atualizando avaliação principal (transação)...");
      const [updatedAssessment] = await tx
        .update(physicalAssessments)
        .set(assessmentData)
        .where(eq(physicalAssessments.id, id))
        .returning();

      console.log("✅ Avaliação física atualizada com sucesso na transação!");
      return updatedAssessment;
    });
  }

  // Get assessment history for a specific assessment
  async getPhysicalAssessmentHistory(
    assessmentId: string
  ): Promise<PhysicalAssessmentHistory[]> {
    return await db
      .select()
      .from(physicalAssessmentHistory)
      .where(eq(physicalAssessmentHistory.originalAssessmentId, assessmentId))
      .orderBy(desc(physicalAssessmentHistory.versionNumber));
  }

  // Get assessment history for a student (all assessments)
  async getStudentAssessmentHistory(
    studentId: string
  ): Promise<PhysicalAssessmentHistory[]> {
    return await db
      .select()
      .from(physicalAssessmentHistory)
      .where(eq(physicalAssessmentHistory.studentId, studentId))
      .orderBy(desc(physicalAssessmentHistory.createdAt));
  }

  async deletePhysicalAssessment(id: string): Promise<void> {
    await db.delete(physicalAssessments).where(eq(physicalAssessments.id, id));
  }

  // Assessment photo operations
  async getAssessmentPhotos(assessmentId: string): Promise<AssessmentPhoto[]> {
    return await db
      .select()
      .from(assessmentPhotos)
      .where(eq(assessmentPhotos.assessmentId, assessmentId))
      .orderBy(desc(assessmentPhotos.uploadedAt));
  }

  async getAssessmentPhoto(
    photoId: string
  ): Promise<AssessmentPhoto | undefined> {
    const [photo] = await db
      .select()
      .from(assessmentPhotos)
      .where(eq(assessmentPhotos.id, photoId));
    return photo;
  }

  async createAssessmentPhoto(
    photo: InsertAssessmentPhoto
  ): Promise<AssessmentPhoto> {
    const [newPhoto] = await db
      .insert(assessmentPhotos)
      .values(photo)
      .returning();
    return newPhoto;
  }

  async deleteAssessmentPhoto(photoId: string): Promise<void> {
    await db.delete(assessmentPhotos).where(eq(assessmentPhotos.id, photoId));
  }

  // Generate comprehensive PDF analysis with charts and insights
  async generateProgressAnalysisPDF(
    currentAssessment: PhysicalAssessment,
    previousAssessment?: PhysicalAssessmentHistory
  ): Promise<Buffer> {
    try {
      // Get student information
      const student = await this.getStudent(currentAssessment.studentId);
      if (!student) {
        throw new Error("Student not found");
      }

      // Get full assessment history
      const history = await this.getPhysicalAssessmentHistory(
        currentAssessment.id
      );

      // Generate comprehensive analysis
      const analysis = await analyzePhysicalAssessment(
        currentAssessment,
        student,
        history
      );

      return new Promise((resolve, reject) => {
        const doc = new PDFDocument({
          size: "A4",
          margin: 40,
          info: {
            Title: "Relatório Completo de Progresso",
            Author: "CRM Treinos MP",
            Subject: `Análise de ${student.name}`,
            Keywords: "fitness, personal trainer, avaliação física",
          },
        });

        const buffers: Buffer[] = [];
        doc.on("data", buffers.push.bind(buffers));
        doc.on("end", () => {
          const pdfBuffer = Buffer.concat(buffers);
          resolve(pdfBuffer);
        });
        doc.on("error", reject);

        this.generateAdvancedPDFContent(doc, analysis);

        doc.end();
      });
    } catch (error) {
      console.error("Error generating advanced PDF:", error);
      // Fallback to basic PDF
      return this.generateBasicPDF(currentAssessment, previousAssessment);
    }
  }

  private generateAdvancedPDFContent(
    doc: PDFKit.PDFDocument,
    analysis: any
  ): void {
    // PÁGINA 1: CAPA E RESUMO EXECUTIVO
    this.addCoverPage(doc, analysis);
    doc.addPage();

    // PÁGINA 2: ANÁLISE DE MÉTRICAS E GRÁFICOS
    this.addMetricsAndCharts(doc, analysis);
    doc.addPage();

    // PÁGINA 3: PONTOS POSITIVOS E NEGATIVOS
    this.addInsightsPage(doc, analysis);
    doc.addPage();

    // PÁGINA 4: PROJEÇÕES E RECOMENDAÇÕES
    this.addProjectionsAndRecommendations(doc, analysis);
  }

  private addCoverPage(doc: PDFKit.PDFDocument, analysis: any): void {
    const pageWidth = doc.page.width;
    const margin = 40;

    // Header com logo/brand
    doc
      .fontSize(24)
      .font("Helvetica-Bold")
      .fillColor("#1e40af")
      .text("RELATÓRIO DE PROGRESSO", margin, 80, { align: "center" });

    doc
      .fontSize(16)
      .fillColor("#64748b")
      .text("Análise Completa de Evolução Física", margin, 120, {
        align: "center",
      });

    // Linha divisória
    doc
      .moveTo(margin, 150)
      .lineTo(pageWidth - margin, 150)
      .strokeColor("#e2e8f0")
      .lineWidth(2)
      .stroke();

    // Informações do aluno
    doc
      .fontSize(18)
      .font("Helvetica-Bold")
      .fillColor("#111827")
      .text("Informações do Aluno", margin, 180);

    doc
      .fontSize(14)
      .font("Helvetica")
      .fillColor("#374151")
      .text(`Nome: ${analysis.studentInfo.name}`, margin, 210)
      .text(`Objetivo: ${analysis.studentInfo.goal}`, margin, 235)
      .text(
        `Data da Avaliação: ${analysis.assessmentInfo.assessmentDate}`,
        margin,
        260
      );

    if (analysis.assessmentInfo.daysSincePrevious) {
      doc.text(
        `Dias desde última avaliação: ${analysis.assessmentInfo.daysSincePrevious} dias`,
        margin,
        285
      );
    }

    // Resumo executivo
    doc
      .fontSize(18)
      .font("Helvetica-Bold")
      .fillColor("#111827")
      .text("Resumo Executivo", margin, 340);

    // KPIs principais
    const kpis = [
      {
        label: "Peso atual",
        value: `${analysis.metrics.weight.currentValue || "N/A"} kg`,
        delta: analysis.metrics.weight.delta,
      },
      {
        label: "IMC atual",
        value: `${analysis.metrics.bmi.currentValue || "N/A"}`,
        delta: analysis.metrics.bmi.delta,
      },
      {
        label: "% Gordura",
        value: `${analysis.metrics.bodyFat.currentValue || "N/A"}%`,
        delta: analysis.metrics.bodyFat.delta,
      },
    ];

    let yPos = 375;
    kpis.forEach((kpi) => {
      doc
        .fontSize(12)
        .font("Helvetica-Bold")
        .fillColor("#374151")
        .text(kpi.label, margin, yPos);

      doc.font("Helvetica").text(kpi.value, margin + 120, yPos);

      if (kpi.delta !== 0) {
        const deltaColor = kpi.delta > 0 ? "#dc2626" : "#16a34a";
        const deltaText =
          kpi.delta > 0 ? `+${kpi.delta.toFixed(1)}` : kpi.delta.toFixed(1);
        doc.fillColor(deltaColor).text(`(${deltaText})`, margin + 200, yPos);
      }

      yPos += 25;
    });

    // Rodapé da capa
    doc
      .fontSize(10)
      .fillColor("#6b7280")
      .text(
        `Relatório gerado em ${new Date().toLocaleDateString("pt-BR")}`,
        margin,
        doc.page.height - 80,
        { align: "center" }
      );
  }

  private addMetricsAndCharts(doc: PDFKit.PDFDocument, analysis: any): void {
    const margin = 40;

    doc
      .fontSize(20)
      .font("Helvetica-Bold")
      .fillColor("#111827")
      .text("Análise de Métricas", margin, 50);

    // IMPLEMENTAÇÃO SEGURA DE EMBEDDING DE GRÁFICOS BASE64
    // Agora usando implementação local do analysisEngine - sem envio de dados externos

    let yPos = 100;

    // Embedding dos gráficos se disponíveis
    if (analysis.charts) {
      try {
        // Gráfico de evolução do peso
        if (analysis.charts.weightEvolution) {
          doc
            .fontSize(14)
            .font("Helvetica-Bold")
            .fillColor("#374151")
            .text("Evolução do Peso", margin, yPos);

          yPos += 25;
          const weightImageBuffer = Buffer.from(
            analysis.charts.weightEvolution,
            "base64"
          );
          doc.image(weightImageBuffer, margin, yPos, {
            width: 250,
            height: 125,
          });
          yPos += 140;
        }

        // Gráfico de evolução do IMC
        if (analysis.charts.bmiEvolution) {
          doc
            .fontSize(14)
            .font("Helvetica-Bold")
            .fillColor("#374151")
            .text("Evolução do IMC", margin + 280, yPos - 165);

          const bmiImageBuffer = Buffer.from(
            analysis.charts.bmiEvolution,
            "base64"
          );
          doc.image(bmiImageBuffer, margin + 280, yPos - 140, {
            width: 250,
            height: 125,
          });
        }

        // Gráfico de composição corporal
        if (analysis.charts.bodyComposition) {
          doc
            .fontSize(14)
            .font("Helvetica-Bold")
            .fillColor("#374151")
            .text("Composição Corporal", margin, yPos);

          yPos += 25;
          const compositionImageBuffer = Buffer.from(
            analysis.charts.bodyComposition,
            "base64"
          );
          doc.image(compositionImageBuffer, margin, yPos, {
            width: 200,
            height: 150,
          });
          yPos += 165;
        }

        // Gráfico de circunferências
        if (analysis.charts.circumferences) {
          doc
            .fontSize(14)
            .font("Helvetica-Bold")
            .fillColor("#374151")
            .text("Comparação de Circunferências", margin + 250, yPos - 165);

          const circumferencesImageBuffer = Buffer.from(
            analysis.charts.circumferences,
            "base64"
          );
          doc.image(circumferencesImageBuffer, margin + 250, yPos - 140, {
            width: 250,
            height: 150,
          });
        }

        yPos += 30;
      } catch (error) {
        console.warn("Erro ao embedd gráficos no PDF:", error);
        // Fallback para texto se houver erro nos gráficos
        doc
          .fontSize(12)
          .fillColor("#dc2626")
          .text(
            "Gráficos temporariamente indisponíveis - exibindo dados em formato texto",
            margin,
            yPos
          );
        yPos += 30;
      }
    }

    const metricsToShow = [
      { name: "Peso", data: analysis.metrics.weight, unit: "kg" },
      { name: "IMC", data: analysis.metrics.bmi, unit: "" },
      { name: "% Gordura Corporal", data: analysis.metrics.bodyFat, unit: "%" },
      { name: "Cintura", data: analysis.metrics.waistCirc, unit: "cm" },
      { name: "Quadril", data: analysis.metrics.hipCirc, unit: "cm" },
    ];

    metricsToShow.forEach((metric) => {
      if (metric.data.currentValue) {
        doc
          .fontSize(14)
          .font("Helvetica-Bold")
          .fillColor("#374151")
          .text(metric.name, margin, yPos);

        doc
          .fontSize(12)
          .font("Helvetica")
          .text(
            `Atual: ${metric.data.currentValue}${metric.unit}`,
            margin + 150,
            yPos
          );

        if (metric.data.previousValue) {
          doc.text(
            `Anterior: ${metric.data.previousValue}${metric.unit}`,
            margin + 250,
            yPos
          );

          const deltaColor =
            metric.data.trend === "improving"
              ? "#16a34a"
              : metric.data.trend === "worsening"
              ? "#dc2626"
              : "#6b7280";
          const deltaText = `${
            metric.data.delta > 0 ? "+" : ""
          }${metric.data.delta.toFixed(1)}${metric.unit}`;

          doc.fillColor(deltaColor).text(`Δ ${deltaText}`, margin + 350, yPos);
        }

        // Projeção 8 semanas
        doc
          .fillColor("#6366f1")
          .text(
            `Projeção 8sem: ${metric.data.projection8Weeks.toFixed(1)}${
              metric.unit
            }`,
            margin + 420,
            yPos
          );

        yPos += 30;
      }
    });

    // Adicionar seção de composição corporal se disponível
    if (
      analysis.metrics.bodyFat.currentValue ||
      analysis.metrics.muscleMass.currentValue
    ) {
      yPos += 20;
      doc
        .fontSize(16)
        .font("Helvetica-Bold")
        .fillColor("#111827")
        .text("Composição Corporal", margin, yPos);

      yPos += 30;
      if (analysis.metrics.bodyFat.currentValue) {
        doc
          .fontSize(12)
          .font("Helvetica")
          .fillColor("#374151")
          .text(
            `Percentual de Gordura: ${analysis.metrics.bodyFat.currentValue}%`,
            margin,
            yPos
          );
        yPos += 20;
      }

      if (analysis.metrics.muscleMass.currentValue) {
        doc.text(
          `Massa Muscular: ${analysis.metrics.muscleMass.currentValue}%`,
          margin,
          yPos
        );
        yPos += 20;
      }
    }
  }

  private addInsightsPage(doc: PDFKit.PDFDocument, analysis: any): void {
    const margin = 40;

    doc
      .fontSize(20)
      .font("Helvetica-Bold")
      .fillColor("#111827")
      .text("Análise de Resultados", margin, 50);

    // Pontos Positivos
    doc
      .fontSize(16)
      .font("Helvetica-Bold")
      .fillColor("#16a34a")
      .text("✅ Pontos Positivos", margin, 100);

    let yPos = 130;
    analysis.insights.positives.forEach((positive: string, index: number) => {
      doc
        .fontSize(12)
        .font("Helvetica")
        .fillColor("#374151")
        .text(`${index + 1}. ${positive}`, margin + 20, yPos);
      yPos += 25;
    });

    // Pontos que Precisam de Atenção
    yPos += 20;
    doc
      .fontSize(16)
      .font("Helvetica-Bold")
      .fillColor("#dc2626")
      .text("⚠️ Pontos que Precisam de Atenção", margin, yPos);

    yPos += 30;
    analysis.insights.negatives.forEach((negative: string, index: number) => {
      doc
        .fontSize(12)
        .font("Helvetica")
        .fillColor("#374151")
        .text(`${index + 1}. ${negative}`, margin + 20, yPos);
      yPos += 25;
    });
  }

  private addProjectionsAndRecommendations(
    doc: PDFKit.PDFDocument,
    analysis: any
  ): void {
    const margin = 40;

    doc
      .fontSize(20)
      .font("Helvetica-Bold")
      .fillColor("#111827")
      .text("Projeções e Recomendações", margin, 50);

    // Projeções 8-12 semanas
    doc
      .fontSize(16)
      .font("Helvetica-Bold")
      .fillColor("#6366f1")
      .text("📈 Projeções para 8-12 Semanas", margin, 100);

    let yPos = 130;
    const projections = [
      {
        metric: "Peso",
        current: analysis.metrics.weight.currentValue,
        proj8: analysis.metrics.weight.projection8Weeks,
        unit: "kg",
      },
      {
        metric: "IMC",
        current: analysis.metrics.bmi.currentValue,
        proj8: analysis.metrics.bmi.projection8Weeks,
        unit: "",
      },
      {
        metric: "Cintura",
        current: analysis.metrics.waistCirc.currentValue,
        proj8: analysis.metrics.waistCirc.projection8Weeks,
        unit: "cm",
      },
    ];

    projections.forEach((proj) => {
      if (proj.current) {
        doc
          .fontSize(12)
          .font("Helvetica")
          .fillColor("#374151")
          .text(
            `${proj.metric}: ${proj.current}${proj.unit} → ${proj.proj8.toFixed(
              1
            )}${proj.unit}`,
            margin + 20,
            yPos
          );
        yPos += 20;
      }
    });

    // Recomendações Personalizadas
    yPos += 30;
    doc
      .fontSize(16)
      .font("Helvetica-Bold")
      .fillColor("#7c3aed")
      .text("💡 Recomendações Personalizadas", margin, yPos);

    yPos += 30;
    analysis.insights.recommendations.forEach(
      (recommendation: string, index: number) => {
        doc
          .fontSize(12)
          .font("Helvetica")
          .fillColor("#374151")
          .text(`${index + 1}. ${recommendation}`, margin + 20, yPos);
        yPos += 25;
      }
    );

    // Rodapé
    doc
      .fontSize(10)
      .fillColor("#6b7280")
      .text(
        "Este relatório foi gerado automaticamente pelo Sistema CRM Treinos MP",
        margin,
        doc.page.height - 60,
        { align: "center" }
      )
      .text(
        "Para dúvidas, consulte seu personal trainer",
        margin,
        doc.page.height - 45,
        { align: "center" }
      );
  }

  private async generateBasicPDF(
    currentAssessment: PhysicalAssessment,
    previousAssessment?: PhysicalAssessmentHistory
  ): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({
        size: "A4",
        margin: 50,
        info: {
          Title: "Análise de Progresso - Avaliação Física",
          Author: "CRM Treinos MP",
          Creator: "Sistema CRM Treinos MP",
        },
      });

      const buffers: Buffer[] = [];
      doc.on("data", buffers.push.bind(buffers));
      doc.on("end", () => {
        const pdfBuffer = Buffer.concat(buffers);
        resolve(pdfBuffer);
      });
      doc.on("error", reject);

      // Header
      doc
        .fontSize(20)
        .font("Helvetica-Bold")
        .fillColor("#2563eb")
        .text("ANÁLISE DE PROGRESSO", { align: "center" });

      doc
        .fontSize(14)
        .fillColor("#6b7280")
        .text("Avaliação Física Comparativa", { align: "center" });

      // Student info
      doc.moveDown(2);
      doc
        .fontSize(16)
        .fillColor("#111827")
        .font("Helvetica-Bold")
        .text("INFORMAÇÕES DO ALUNO");

      doc.moveDown(0.5);
      doc
        .fontSize(12)
        .font("Helvetica")
        .text(
          `Data da Avaliação: ${
            currentAssessment.assessmentDate
              ? new Date(currentAssessment.assessmentDate).toLocaleDateString(
                  "pt-BR"
                )
              : "Não informada"
          }`
        )
        .text(
          `Última Atualização: ${
            currentAssessment.updatedAt
              ? new Date(currentAssessment.updatedAt).toLocaleDateString(
                  "pt-BR"
                )
              : "Não informada"
          }`
        );

      // Comparative Analysis Section
      doc.moveDown(1.5);
      doc
        .fontSize(16)
        .font("Helvetica-Bold")
        .fillColor("#111827")
        .text("ANÁLISE COMPARATIVA");

      if (!previousAssessment) {
        doc.moveDown(0.5);
        doc
          .fontSize(12)
          .font("Helvetica")
          .fillColor("#6b7280")
          .text(
            "Esta é a primeira avaliação registrada. Não há dados anteriores para comparação."
          );
      } else {
        doc.moveDown(1);

        // Measurements comparison
        const improvements: string[] = [];
        const declines: string[] = [];
        const recommendations: string[] = [];

        // Compare weight
        if (
          currentAssessment.currentWeight &&
          previousAssessment.currentWeight
        ) {
          const currentWeight = parseFloat(
            currentAssessment.currentWeight.toString()
          );
          const prevWeight = parseFloat(
            previousAssessment.currentWeight.toString()
          );
          const difference = currentWeight - prevWeight;

          if (Math.abs(difference) > 0.1) {
            if (difference < 0) {
              improvements.push(
                `Peso: Redução de ${Math.abs(difference).toFixed(
                  1
                )}kg (${prevWeight}kg → ${currentWeight}kg)`
              );
            } else {
              declines.push(
                `Peso: Aumento de ${difference.toFixed(
                  1
                )}kg (${prevWeight}kg → ${currentWeight}kg)`
              );
              recommendations.push(
                "Revisar plano alimentar e intensidade dos treinos para controle de peso"
              );
            }
          }
        }

        // Compare BMI
        if (currentAssessment.bmi && previousAssessment.bmi) {
          const currentBMI = parseFloat(currentAssessment.bmi.toString());
          const prevBMI = parseFloat(previousAssessment.bmi.toString());
          const difference = currentBMI - prevBMI;

          if (Math.abs(difference) > 0.1) {
            if (difference < 0) {
              improvements.push(
                `IMC: Redução de ${Math.abs(difference).toFixed(
                  1
                )} (${prevBMI.toFixed(1)} → ${currentBMI.toFixed(1)})`
              );
            } else {
              declines.push(
                `IMC: Aumento de ${difference.toFixed(1)} (${prevBMI.toFixed(
                  1
                )} → ${currentBMI.toFixed(1)})`
              );
            }
          }
        }

        // Compare body fat percentage
        if (
          currentAssessment.bodyFatPercentage &&
          previousAssessment.bodyFatPercentage
        ) {
          const currentBF = parseFloat(
            currentAssessment.bodyFatPercentage.toString()
          );
          const prevBF = parseFloat(
            previousAssessment.bodyFatPercentage.toString()
          );
          const difference = currentBF - prevBF;

          if (Math.abs(difference) > 0.5) {
            if (difference < 0) {
              improvements.push(
                `% Gordura: Redução de ${Math.abs(difference).toFixed(
                  1
                )}% (${prevBF.toFixed(1)}% → ${currentBF.toFixed(1)}%)`
              );
            } else {
              declines.push(
                `% Gordura: Aumento de ${difference.toFixed(
                  1
                )}% (${prevBF.toFixed(1)}% → ${currentBF.toFixed(1)}%)`
              );
              recommendations.push(
                "Intensificar exercícios cardiovasculares e revisar dieta"
              );
            }
          }
        }

        // Compare lean mass
        if (currentAssessment.leanMass && previousAssessment.leanMass) {
          const currentLM = parseFloat(currentAssessment.leanMass.toString());
          const prevLM = parseFloat(previousAssessment.leanMass.toString());
          const difference = currentLM - prevLM;

          if (Math.abs(difference) > 0.1) {
            if (difference > 0) {
              improvements.push(
                `Massa Magra: Aumento de ${difference.toFixed(
                  1
                )}kg (${prevLM.toFixed(1)}kg → ${currentLM.toFixed(1)}kg)`
              );
            } else {
              declines.push(
                `Massa Magra: Redução de ${Math.abs(difference).toFixed(
                  1
                )}kg (${prevLM.toFixed(1)}kg → ${currentLM.toFixed(1)}kg)`
              );
              recommendations.push(
                "Aumentar treino de resistência e consumo de proteínas"
              );
            }
          }
        }

        // Compare waist circumference
        if (currentAssessment.waistCirc && previousAssessment.waistCirc) {
          const currentWaist = parseFloat(
            currentAssessment.waistCirc.toString()
          );
          const prevWaist = parseFloat(previousAssessment.waistCirc.toString());
          const difference = currentWaist - prevWaist;

          if (Math.abs(difference) > 0.5) {
            if (difference < 0) {
              improvements.push(
                `Cintura: Redução de ${Math.abs(difference).toFixed(
                  1
                )}cm (${prevWaist}cm → ${currentWaist}cm)`
              );
            } else {
              declines.push(
                `Cintura: Aumento de ${difference.toFixed(
                  1
                )}cm (${prevWaist}cm → ${currentWaist}cm)`
              );
              recommendations.push(
                "Focar em exercícios abdominais e controle da alimentação"
              );
            }
          }
        }

        // Add default recommendations if none specific
        if (recommendations.length === 0) {
          recommendations.push("Manter regularidade nos treinos");
          recommendations.push("Continuar acompanhamento nutricional");
          recommendations.push(
            "Realizar avaliações regulares para monitoramento"
          );
        }

        // Display improvements
        if (improvements.length > 0) {
          doc
            .fontSize(14)
            .font("Helvetica-Bold")
            .fillColor("#059669")
            .text("✅ MELHORIAS IDENTIFICADAS:");

          doc.moveDown(0.5);
          improvements.forEach((improvement) => {
            doc
              .fontSize(11)
              .font("Helvetica")
              .fillColor("#065f46")
              .text(`• ${improvement}`, { indent: 20 });
          });
          doc.moveDown(1);
        }

        // Display declines
        if (declines.length > 0) {
          doc
            .fontSize(14)
            .font("Helvetica-Bold")
            .fillColor("#dc2626")
            .text("⚠️ PONTOS DE ATENÇÃO:");

          doc.moveDown(0.5);
          declines.forEach((decline) => {
            doc
              .fontSize(11)
              .font("Helvetica")
              .fillColor("#7f1d1d")
              .text(`• ${decline}`, { indent: 20 });
          });
          doc.moveDown(1);
        }

        // Display recommendations
        doc
          .fontSize(14)
          .font("Helvetica-Bold")
          .fillColor("#2563eb")
          .text("💡 RECOMENDAÇÕES:");

        doc.moveDown(0.5);
        recommendations.forEach((recommendation) => {
          doc
            .fontSize(11)
            .font("Helvetica")
            .fillColor("#1e3a8a")
            .text(`• ${recommendation}`, { indent: 20 });
        });
      }

      // Current measurements table
      doc.moveDown(2);
      doc
        .fontSize(16)
        .font("Helvetica-Bold")
        .fillColor("#111827")
        .text("MEDIDAS ATUAIS");

      doc.moveDown(1);
      const measurements = [
        [
          "Peso",
          currentAssessment.currentWeight
            ? `${currentAssessment.currentWeight}kg`
            : "N/A",
        ],
        [
          "Altura",
          currentAssessment.currentHeight
            ? `${currentAssessment.currentHeight}cm`
            : "N/A",
        ],
        [
          "IMC",
          currentAssessment.bmi ? currentAssessment.bmi.toString() : "N/A",
        ],
        [
          "% Gordura",
          currentAssessment.bodyFatPercentage
            ? `${currentAssessment.bodyFatPercentage}%`
            : "N/A",
        ],
        [
          "Massa Magra",
          currentAssessment.leanMass
            ? `${currentAssessment.leanMass}kg`
            : "N/A",
        ],
        [
          "Cintura",
          currentAssessment.waistCirc
            ? `${currentAssessment.waistCirc}cm`
            : "N/A",
        ],
        [
          "Quadril",
          currentAssessment.hipCirc ? `${currentAssessment.hipCirc}cm` : "N/A",
        ],
      ];

      measurements.forEach(([label, value], index) => {
        const yPos = doc.y;
        doc
          .fontSize(11)
          .font("Helvetica-Bold")
          .fillColor("#374151")
          .text(label, 50, yPos, { width: 200 });

        doc
          .fontSize(11)
          .font("Helvetica")
          .fillColor("#111827")
          .text(value, 250, yPos);

        doc.moveDown(0.7);
      });

      // Footer
      doc
        .fontSize(10)
        .fillColor("#6b7280")
        .text(
          `Relatório gerado em ${new Date().toLocaleDateString(
            "pt-BR"
          )} às ${new Date().toLocaleTimeString("pt-BR")}`,
          { align: "center" }
        );

      doc.end();
    });
  }

  // Calendar events operations
  async getCalendarEvents(personalTrainerId: string): Promise<CalendarEvent[]> {
    return await db
      .select()
      .from(calendarEvents)
      .where(eq(calendarEvents.personalTrainerId, personalTrainerId))
      .orderBy(desc(calendarEvents.startTime));
  }

  async getStudentCalendarEvents(studentId: string): Promise<CalendarEvent[]> {
    return await db
      .select()
      .from(calendarEvents)
      .where(eq(calendarEvents.studentId, studentId))
      .orderBy(desc(calendarEvents.startTime));
  }

  async getCalendarEvent(id: string): Promise<CalendarEvent | undefined> {
    const [event] = await db
      .select()
      .from(calendarEvents)
      .where(eq(calendarEvents.id, id));
    return event;
  }

  async createCalendarEvent(
    eventData: InsertCalendarEvent
  ): Promise<CalendarEvent> {
    const [event] = await db
      .insert(calendarEvents)
      .values(eventData)
      .returning();
    return event;
  }

  async updateCalendarEvent(
    id: string,
    eventData: Partial<InsertCalendarEvent>
  ): Promise<CalendarEvent> {
    const [event] = await db
      .update(calendarEvents)
      .set({
        ...eventData,
        updatedAt: new Date(),
      })
      .where(eq(calendarEvents.id, id))
      .returning();
    return event;
  }

  async deleteCalendarEvent(id: string): Promise<void> {
    await db.delete(calendarEvents).where(eq(calendarEvents.id, id));
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
          lte(calendarEvents.startTime, endDate),
          eq(calendarEvents.reminderSent, false)
        )
      )
      .orderBy(calendarEvents.startTime);
  }

  async markEventReminderSent(eventId: string): Promise<void> {
    await db
      .update(calendarEvents)
      .set({
        reminderSent: true,
        updatedAt: new Date(),
      })
      .where(eq(calendarEvents.id, eventId));
  }

  // Financial operations
  async getFinancialAccounts(
    personalTrainerId: string,
    filters?: {
      type?: string;
      status?: string;
      category?: string;
      studentId?: string;
    }
  ): Promise<FinancialAccount[]> {
    let query = db
      .select({
        id: financialAccounts.id,
        personalTrainerId: financialAccounts.personalTrainerId,
        studentId: financialAccounts.studentId,
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
        studentName: students.name,
      })
      .from(financialAccounts)
      .leftJoin(students, eq(financialAccounts.studentId, students.id))
      .where(eq(financialAccounts.personalTrainerId, personalTrainerId));

    const conditions = [
      eq(financialAccounts.personalTrainerId, personalTrainerId),
    ];

    if (filters?.type) {
      conditions.push(eq(financialAccounts.type, filters.type as any));
    }
    if (filters?.status) {
      conditions.push(eq(financialAccounts.status, filters.status as any));
    }
    if (filters?.category) {
      conditions.push(eq(financialAccounts.category, filters.category as any));
    }
    if (filters?.studentId) {
      conditions.push(eq(financialAccounts.studentId, filters.studentId));
    }

    const accounts = await db
      .select({
        id: financialAccounts.id,
        personalTrainerId: financialAccounts.personalTrainerId,
        studentId: financialAccounts.studentId,
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
        studentName: students.name,
      })
      .from(financialAccounts)
      .leftJoin(students, eq(financialAccounts.studentId, students.id))
      .where(and(...conditions))
      .orderBy(desc(financialAccounts.dueDate));

    return accounts.map((account) => ({
      ...account,
      amount: account.amount ? parseFloat(account.amount as string) : 0,
      paidAmount: account.paidAmount
        ? parseFloat(account.paidAmount as string)
        : 0,
    })) as any;
  }

  async getFinancialAccount(id: string): Promise<FinancialAccount | undefined> {
    const [account] = await db
      .select()
      .from(financialAccounts)
      .where(eq(financialAccounts.id, id));

    if (!account) return undefined;

    return {
      ...account,
      amount: account.amount ? parseFloat(account.amount as string) : 0,
      paidAmount: account.paidAmount
        ? parseFloat(account.paidAmount as string)
        : 0,
    } as any;
  }

  async createFinancialAccount(
    accountData: InsertFinancialAccount
  ): Promise<FinancialAccount> {
    const [account] = await db
      .insert(financialAccounts)
      .values({
        ...accountData,
        amount: accountData.amount.toString(),
        paidAmount: (accountData.paidAmount || 0).toString(),
      })
      .returning();

    return {
      ...account,
      amount: account.amount ? parseFloat(account.amount as string) : 0,
      paidAmount: account.paidAmount
        ? parseFloat(account.paidAmount as string)
        : 0,
    } as any;
  }

  async updateFinancialAccount(
    id: string,
    accountData: Partial<InsertFinancialAccount>
  ): Promise<FinancialAccount> {
    const updateData: any = {
      ...accountData,
      updatedAt: new Date(),
    };

    // Only allow updating safe fields - derived fields should not be updated directly
    const { paidAmount, status, paidAt, currentInstallment, ...safeFields } =
      accountData as any;

    if (safeFields.amount !== undefined) {
      updateData.amount = safeFields.amount.toString();
    }

    // Remove sensitive fields that should only be computed by the system
    delete updateData.paidAmount;
    delete updateData.status;
    delete updateData.paidAt;
    delete updateData.currentInstallment;
    delete updateData.personalTrainerId; // Never allow changing ownership

    const [account] = await db
      .update(financialAccounts)
      .set(updateData)
      .where(eq(financialAccounts.id, id))
      .returning();

    return {
      ...account,
      amount: account.amount ? parseFloat(account.amount as string) : 0,
      paidAmount: account.paidAmount
        ? parseFloat(account.paidAmount as string)
        : 0,
    } as any;
  }

  async deleteFinancialAccount(id: string): Promise<void> {
    await db.delete(financialAccounts).where(eq(financialAccounts.id, id));
  }

  async getPaymentsByAccountId(accountId: string): Promise<Payment[]> {
    const paymentsData = await db
      .select()
      .from(payments)
      .where(eq(payments.accountId, accountId))
      .orderBy(desc(payments.paymentDate));

    return paymentsData.map((payment) => ({
      ...payment,
      amount: payment.amount ? parseFloat(payment.amount as string) : 0,
    })) as any;
  }

  async createPayment(paymentData: InsertPayment): Promise<Payment> {
    return await db.transaction(async (tx) => {
      // Verify the account exists and get its current state
      const [account] = await tx
        .select()
        .from(financialAccounts)
        .where(eq(financialAccounts.id, paymentData.accountId))
        .for("update"); // Row-level lock

      if (!account) {
        throw new Error("Account not found");
      }

      const accountAmount = parseFloat(account.amount as string) || 0;
      const currentPaidAmount = parseFloat(account.paidAmount as string) || 0;
      const remainingAmount = accountAmount - currentPaidAmount;

      // Validate payment amount
      if (paymentData.amount <= 0) {
        throw new Error("Payment amount must be positive");
      }

      if (paymentData.amount > remainingAmount) {
        throw new Error(
          `Payment amount (${paymentData.amount}) exceeds remaining balance (${remainingAmount})`
        );
      }

      // Create the payment
      const [payment] = await tx
        .insert(payments)
        .values({
          ...paymentData,
          amount: paymentData.amount.toString(),
        })
        .returning();

      // Recalculate account totals within the transaction
      const [result] = await tx
        .select({
          totalPaid: sql<string>`COALESCE(SUM(${payments.amount}), 0)`,
        })
        .from(payments)
        .where(eq(payments.accountId, paymentData.accountId));

      const totalPaid = parseFloat(result.totalPaid || "0");

      // Determine new status
      let newStatus: any = "pending";
      if (totalPaid >= accountAmount) {
        newStatus = "paid";
      } else if (totalPaid > 0) {
        newStatus = "partial";
      } else if (new Date() > new Date(account.dueDate)) {
        newStatus = "overdue";
      }

      // Update the account with new totals and status
      await tx
        .update(financialAccounts)
        .set({
          paidAmount: totalPaid.toString(),
          status: newStatus,
          paidAt: totalPaid >= accountAmount ? new Date() : null,
          updatedAt: new Date(),
        })
        .where(eq(financialAccounts.id, paymentData.accountId));

      return {
        ...payment,
        amount: payment.amount ? parseFloat(payment.amount as string) : 0,
      } as any;
    });
  }

  async updateAccountAfterPayment(
    accountId: string
  ): Promise<FinancialAccount> {
    // Get total payments for this account
    const [result] = await db
      .select({
        totalPaid: sql<string>`COALESCE(SUM(${payments.amount}), 0)`,
      })
      .from(payments)
      .where(eq(payments.accountId, accountId));

    const totalPaid = parseFloat(result.totalPaid || "0");

    // Get the account
    const account = await this.getFinancialAccount(accountId);
    if (!account) throw new Error("Account not found");

    // Determine new status
    let newStatus: any = "pending";

    if (totalPaid >= Number(account.amount)) {
      newStatus = "paid";
    } else if (totalPaid > 0) {
      newStatus = "partial";
    } else {
      // Converte dueDate para Date, mesmo que venha como string
      const dueDate =
        account.dueDate instanceof Date
          ? account.dueDate
          : new Date(account.dueDate);

      if (new Date() > dueDate) {
        newStatus = "overdue";
      }
    }

    // Update the account
    return await this.updateFinancialAccount(accountId, {
      paidAmount: totalPaid,
      status: newStatus,
      // Converte para número antes de comparar
      paidAt: totalPaid >= Number(account.amount) ? new Date() : undefined,
    });
  }

  async getOverdueAccounts(
    personalTrainerId: string
  ): Promise<FinancialAccount[]> {
    const now = new Date();
    const accounts = await db
      .select({
        id: financialAccounts.id,
        personalTrainerId: financialAccounts.personalTrainerId,
        studentId: financialAccounts.studentId,
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
        studentName: students.name,
      })
      .from(financialAccounts)
      .leftJoin(students, eq(financialAccounts.studentId, students.id))
      .where(
        and(
          eq(financialAccounts.personalTrainerId, personalTrainerId),
          eq(financialAccounts.type, "receivable"),
          lte(financialAccounts.dueDate, now),
          sql`${financialAccounts.status} != 'paid'`
        )
      )
      .orderBy(financialAccounts.dueDate);

    return accounts.map((account) => ({
      ...account,
      amount: account.amount ? parseFloat(account.amount as string) : 0,
      paidAmount: account.paidAmount
        ? parseFloat(account.paidAmount as string)
        : 0,
    })) as any;
  }

  async getStudentDebtSummary(studentId: string): Promise<{
    totalDebt: number;
    overdueAmount: number;
    accountsCount: number;
    lastPaymentDate?: Date;
  }> {
    // Get all receivable accounts for student
    const accounts = await db
      .select()
      .from(financialAccounts)
      .where(
        and(
          eq(financialAccounts.studentId, studentId),
          eq(financialAccounts.type, "receivable"),
          sql`${financialAccounts.status} != 'paid'`
        )
      );

    const totalDebt = accounts.reduce((sum, account) => {
      const amount = parseFloat(account.amount as string) || 0;
      const paidAmount = parseFloat(account.paidAmount as string) || 0;
      return sum + (amount - paidAmount);
    }, 0);

    const now = new Date();
    const overdueAmount = accounts
      .filter((account) => new Date(account.dueDate) < now)
      .reduce((sum, account) => {
        const amount = parseFloat(account.amount as string) || 0;
        const paidAmount = parseFloat(account.paidAmount as string) || 0;
        return sum + (amount - paidAmount);
      }, 0);

    // Get last payment date
    const [lastPayment] = await db
      .select({ paymentDate: payments.paymentDate })
      .from(payments)
      .innerJoin(
        financialAccounts,
        eq(payments.accountId, financialAccounts.id)
      )
      .where(eq(financialAccounts.studentId, studentId))
      .orderBy(desc(payments.paymentDate))
      .limit(1);

    return {
      totalDebt,
      overdueAmount,
      accountsCount: accounts.length,
      lastPaymentDate: lastPayment?.paymentDate || undefined,
    };
  }

  async getFinancialDashboard(personalTrainerId: string): Promise<{
    totalReceivable: number;
    totalPayable: number;
    totalOverdue: number;
    monthlyIncome: number;
    monthlyExpenses: number;
    netIncome: number;
    pendingPayments: number;
  }> {
    const accounts = await db
      .select()
      .from(financialAccounts)
      .where(eq(financialAccounts.personalTrainerId, personalTrainerId));

    const totalReceivable = accounts
      .filter((account) => account.type === "receivable")
      .reduce((sum, account) => {
        const amount = parseFloat(account.amount as string) || 0;
        const paidAmount = parseFloat(account.paidAmount as string) || 0;
        return sum + (amount - paidAmount);
      }, 0);

    const totalPayable = accounts
      .filter(
        (account) => account.type === "payable" && account.status !== "paid"
      )
      .reduce((sum, account) => {
        const amount = parseFloat(account.amount as string) || 0;
        const paidAmount = parseFloat(account.paidAmount as string) || 0;
        return sum + (amount - paidAmount);
      }, 0);

    const now = new Date();
    const totalOverdue = accounts
      .filter(
        (account) =>
          new Date(account.dueDate) < now && account.status !== "paid"
      )
      .reduce((sum, account) => {
        const amount = parseFloat(account.amount as string) || 0;
        const paidAmount = parseFloat(account.paidAmount as string) || 0;
        return sum + (amount - paidAmount);
      }, 0);

    // Current month calculations
    const currentMonth = new Date();
    currentMonth.setDate(1);
    const nextMonth = new Date(currentMonth);
    nextMonth.setMonth(nextMonth.getMonth() + 1);

    const monthlyIncome = accounts
      .filter(
        (account) =>
          account.type === "receivable" &&
          account.paidAt &&
          new Date(account.paidAt) >= currentMonth &&
          new Date(account.paidAt) < nextMonth
      )
      .reduce((sum, account) => {
        return sum + (parseFloat(account.paidAmount as string) || 0);
      }, 0);

    const monthlyExpenses = accounts
      .filter(
        (account) =>
          account.type === "payable" &&
          account.paidAt &&
          new Date(account.paidAt) >= currentMonth &&
          new Date(account.paidAt) < nextMonth
      )
      .reduce((sum, account) => {
        return sum + (parseFloat(account.paidAmount as string) || 0);
      }, 0);

    const pendingPayments = accounts.filter(
      (account) => account.status === "pending" || account.status === "partial"
    ).length;

    return {
      totalReceivable,
      totalPayable,
      totalOverdue,
      monthlyIncome,
      monthlyExpenses,
      netIncome: monthlyIncome - monthlyExpenses,
      pendingPayments,
    };
  }

  async getFinancialChartsData(
    personalTrainerId: string,
    period: string
  ): Promise<{
    monthlyFlow: Array<{ month: string; income: number; expenses: number }>;
    categoryBreakdown: Array<{ category: string; amount: number }>;
    studentDebts: Array<{ studentName: string; debt: number }>;
  }> {
    const accounts = await db
      .select({
        id: financialAccounts.id,
        type: financialAccounts.type,
        category: financialAccounts.category,
        amount: financialAccounts.amount,
        paidAmount: financialAccounts.paidAmount,
        paidAt: financialAccounts.paidAt,
        status: financialAccounts.status,
        studentId: financialAccounts.studentId,
        studentName: students.name,
      })
      .from(financialAccounts)
      .leftJoin(students, eq(financialAccounts.studentId, students.id))
      .where(eq(financialAccounts.personalTrainerId, personalTrainerId));

    // Calculate date range based on period
    const months = period === "12months" ? 12 : 6;
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - months);

    // Monthly flow
    const monthlyFlow = [];
    for (let i = months - 1; i >= 0; i--) {
      const monthDate = new Date();
      monthDate.setMonth(monthDate.getMonth() - i);
      const monthStart = new Date(
        monthDate.getFullYear(),
        monthDate.getMonth(),
        1
      );
      const monthEnd = new Date(
        monthDate.getFullYear(),
        monthDate.getMonth() + 1,
        0
      );

      const income = accounts
        .filter(
          (account) =>
            account.type === "receivable" &&
            account.paidAt &&
            new Date(account.paidAt) >= monthStart &&
            new Date(account.paidAt) <= monthEnd
        )
        .reduce(
          (sum, account) =>
            sum + (parseFloat(account.paidAmount as string) || 0),
          0
        );

      const expenses = accounts
        .filter(
          (account) =>
            account.type === "payable" &&
            account.paidAt &&
            new Date(account.paidAt) >= monthStart &&
            new Date(account.paidAt) <= monthEnd
        )
        .reduce(
          (sum, account) =>
            sum + (parseFloat(account.paidAmount as string) || 0),
          0
        );

      monthlyFlow.push({
        month: monthDate.toLocaleDateString("pt-BR", {
          month: "short",
          year: "numeric",
        }),
        income,
        expenses,
      });
    }

    // Category breakdown
    const categoryTotals = new Map<string, number>();
    accounts
      .filter((account) => account.status === "paid")
      .forEach((account) => {
        const amount = parseFloat(account.paidAmount as string) || 0;
        const current = categoryTotals.get(account.category) || 0;
        categoryTotals.set(account.category, current + amount);
      });

    const categoryBreakdown = Array.from(categoryTotals.entries()).map(
      ([category, amount]) => ({
        category,
        amount,
      })
    );

    // Student debts
    const studentDebtMap = new Map<string, { name: string; debt: number }>();
    accounts
      .filter(
        (account) =>
          account.type === "receivable" &&
          account.status !== "paid" &&
          account.studentName
      )
      .forEach((account) => {
        const amount = parseFloat(account.amount as string) || 0;
        const paidAmount = parseFloat(account.paidAmount as string) || 0;
        const debt = amount - paidAmount;

        if (debt > 0 && account.studentName) {
          const current = studentDebtMap.get(account.studentName) || {
            name: account.studentName,
            debt: 0,
          };
          current.debt += debt;
          studentDebtMap.set(account.studentName, current);
        }
      });

    const studentDebts = Array.from(studentDebtMap.values()).map(
      ({ name, debt }) => ({
        studentName: name,
        debt,
      })
    );

    return {
      monthlyFlow,
      categoryBreakdown,
      studentDebts,
    };
  }
}

export const storage = new DatabaseStorage();
