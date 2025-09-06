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
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, sql, count } from "drizzle-orm";

export interface IStorage {
  // User operations
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  upsertUser(user: UpsertUser): Promise<User>;

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
    return await db
      .select()
      .from(workouts)
      .where(eq(workouts.studentId, studentId))
      .orderBy(desc(workouts.createdAt));
  }

  async getWorkout(id: string): Promise<Workout | undefined> {
    const [workout] = await db
      .select()
      .from(workouts)
      .where(eq(workouts.id, id));
    return workout;
  }

  async createWorkout(workout: InsertWorkout): Promise<Workout> {
    const [newWorkout] = await db.insert(workouts).values(workout).returning();
    return newWorkout;
  }

  async updateWorkout(
    id: string,
    workoutData: Partial<InsertWorkout>
  ): Promise<Workout> {
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
        workoutId: workoutSessions.workoutId,
        studentId: workoutSessions.studentId,
        completedAt: workoutSessions.completedAt,
        duration: workoutSessions.duration,
        notes: workoutSessions.notes,
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
    if (student && student.password === password) {
      return student;
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
    // First, get the current assessment to save to history
    const currentAssessment = await this.getPhysicalAssessment(id);
    if (!currentAssessment) {
      throw new Error("Assessment not found");
    }

    // Get the next version number for this assessment's history
    const historyCount = await db
      .select({ count: count() })
      .from(physicalAssessmentHistory)
      .where(eq(physicalAssessmentHistory.originalAssessmentId, id));

    const nextVersion = (historyCount[0]?.count || 0) + 1;

    // Save current version to history before updating
    await db.insert(physicalAssessmentHistory).values({
      originalAssessmentId: id,
      studentId: currentAssessment.studentId,
      personalTrainerId: currentAssessment.personalTrainerId,
      versionNumber: nextVersion,
      currentWeight: currentAssessment.currentWeight,
      currentHeight: currentAssessment.currentHeight,
      bmi: currentAssessment.bmi,
      waistCirc: currentAssessment.waistCirc,
      hipCirc: currentAssessment.hipCirc,
      chestCirc: currentAssessment.chestCirc,
      bodyFatPercentage: currentAssessment.bodyFatPercentage,
      leanMass: currentAssessment.leanMass,
      assessmentDate: currentAssessment.assessmentDate,
    });

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
      updatedAt: new Date(),
    };

    const [updatedAssessment] = await db
      .update(physicalAssessments)
      .set(assessmentData)
      .where(eq(physicalAssessments.id, id))
      .returning();
    return updatedAssessment;
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
}

export const storage = new DatabaseStorage();
