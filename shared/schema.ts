import { sql, relations } from "drizzle-orm";
import {
  index,
  jsonb,
  pgTable,
  timestamp,
  varchar,
  text,
  integer,
  decimal,
  boolean,
  pgEnum,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table.
// (IMPORTANT) This table is mandatory for Replit Auth, don't drop it.
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)]
);

// Enums - definir antes das tabelas
export const roleEnum = pgEnum("role", ["teacher", "student"]);

// User storage table
export const users = pgTable("users", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  email: varchar("email").unique().notNull(),
  password: varchar("password").notNull(),
  firstName: varchar("first_name").notNull(),
  lastName: varchar("last_name").notNull(),
  role: roleEnum("role").notNull().default("teacher"),
  profileImageUrl: varchar("profile_image_url"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});
export const genderEnum = pgEnum("gender", ["male", "female"]);
export const statusEnum = pgEnum("status", ["active", "inactive", "suspended"]);
export const workoutCategoryEnum = pgEnum("workout_category", [
  "chest-triceps",
  "back-biceps",
  "legs",
  "shoulders",
  "cardio",
  "full-body",
]);

// Students table
export const students = pgTable("students", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  personalTrainerId: varchar("personal_trainer_id")
    .notNull()
    .references(() => users.id),
  name: varchar("name").notNull(),
  email: varchar("email").unique(),
  password: varchar("password"), // Para login do aluno
  inviteToken: varchar("invite_token"), // Token para convite por email
  isInvitePending: boolean("is_invite_pending").default(true), // Se ainda está pendente de criar senha
  phone: varchar("phone"),
  dateOfBirth: timestamp("date_of_birth"),
  gender: genderEnum("gender").notNull(),
  weight: decimal("weight", { precision: 5, scale: 2 }),
  height: decimal("height", { precision: 5, scale: 2 }),
  goal: text("goal"),
  medicalConditions: text("medical_conditions"),
  status: statusEnum("status").default("active"),
  profileImage: varchar("profile_image"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Workouts table
export const workouts = pgTable("workouts", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  studentId: varchar("student_id")
    .notNull()
    .references(() => students.id),
  personalTrainerId: varchar("personal_trainer_id")
    .notNull()
    .references(() => users.id),
  name: varchar("name").notNull(),
  category: workoutCategoryEnum("category").notNull(),
  description: text("description"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Exercise templates (biblioteca de exercícios padrão)
export const exerciseTemplates = pgTable("exercise_templates", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  name: varchar("name").notNull().unique(),
  description: text("description"),
  videoUrl: varchar("video_url"), // URL do vídeo do exercício
  muscleGroups: varchar("muscle_groups").array(), // Grupos musculares trabalhados
  equipment: varchar("equipment"), // Equipamento necessário
  difficulty: varchar("difficulty"), // beginner, intermediate, advanced
  createdAt: timestamp("created_at").defaultNow(),
});

// Exercises table
export const exercises = pgTable("exercises", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  workoutId: varchar("workout_id")
    .notNull()
    .references(() => workouts.id, { onDelete: "cascade" }),
  templateId: varchar("template_id").references(() => exerciseTemplates.id), // Referência ao template do exercício
  name: varchar("name").notNull(),
  sets: integer("sets").notNull(),
  reps: varchar("reps").notNull(), // Can be ranges like "12-15"
  weight: decimal("weight", { precision: 5, scale: 2 }),
  restTime: integer("rest_time"), // in seconds
  notes: text("notes"),
  videoUrl: varchar("video_url"), // URL específica para este exercício (sobrescreve o template)
  order: integer("order").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Workout sessions (when a workout is performed)
export const workoutSessions = pgTable("workout_sessions", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  workoutId: varchar("workout_id")
    .notNull()
    .references(() => workouts.id),
  studentId: varchar("student_id")
    .notNull()
    .references(() => students.id),
  completedAt: timestamp("completed_at").defaultNow(),
  duration: integer("duration"), // in minutes
  notes: text("notes"),
});

// Exercise performances (actual performance data)
export const exercisePerformances = pgTable("exercise_performances", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  workoutSessionId: varchar("workout_session_id")
    .notNull()
    .references(() => workoutSessions.id, { onDelete: "cascade" }),
  exerciseId: varchar("exercise_id")
    .notNull()
    .references(() => exercises.id),
  actualSets: integer("actual_sets"),
  actualReps: varchar("actual_reps"),
  actualWeight: decimal("actual_weight", { precision: 5, scale: 2 }),
  exerciseTimeSeconds: integer("exercise_time_seconds"), // Tempo gasto no exercício em segundos
  restTimeSeconds: integer("rest_time_seconds"), // Tempo de descanso em segundos
  completed: boolean("completed").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

// Body measurements
export const bodyMeasurements = pgTable("body_measurements", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  studentId: varchar("student_id")
    .notNull()
    .references(() => students.id),
  weight: decimal("weight", { precision: 5, scale: 2 }),
  bodyFat: decimal("body_fat", { precision: 5, scale: 2 }),
  muscleMass: decimal("muscle_mass", { precision: 5, scale: 2 }),
  chest: decimal("chest", { precision: 5, scale: 2 }),
  waist: decimal("waist", { precision: 5, scale: 2 }),
  hips: decimal("hips", { precision: 5, scale: 2 }),
  arms: decimal("arms", { precision: 5, scale: 2 }),
  thighs: decimal("thighs", { precision: 5, scale: 2 }),
  measuredAt: timestamp("measured_at").defaultNow(),
});

// Historical workout data - rastrea evolução de cargas ao longo do tempo
export const workoutHistory = pgTable("workout_history", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  studentId: varchar("student_id")
    .notNull()
    .references(() => students.id),
  exerciseId: varchar("exercise_id")
    .notNull()
    .references(() => exercises.id),
  exerciseName: varchar("exercise_name").notNull(), // Nome do exercício para referência
  sets: integer("sets").notNull(),
  reps: varchar("reps").notNull(),
  weight: decimal("weight", { precision: 5, scale: 2 }).notNull(),
  previousWeight: decimal("previous_weight", { precision: 5, scale: 2 }), // Carga anterior
  comments: text("comments"), // Comentários do aluno
  completedAt: timestamp("completed_at").defaultNow(),
  workoutSessionId: varchar("workout_session_id").references(
    () => workoutSessions.id
  ),
});

// Student workout comments - para comentários específicos dos treinos
export const workoutComments = pgTable("workout_comments", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  studentId: varchar("student_id")
    .notNull()
    .references(() => students.id),
  workoutSessionId: varchar("workout_session_id")
    .notNull()
    .references(() => workoutSessions.id),
  comment: text("comment").notNull(),
  rating: integer("rating"), // 1-5 estrelas para o treino
  createdAt: timestamp("created_at").defaultNow(),
});

// Physical assessment table
export const physicalAssessments = pgTable("physical_assessments", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  studentId: varchar("student_id")
    .notNull()
    .references(() => students.id),
  personalTrainerId: varchar("personal_trainer_id")
    .notNull()
    .references(() => users.id),

  // 1. Identificação básica
  profession: varchar("profession"),

  // 2. Histórico de saúde
  healthDiagnoses: text("health_diagnoses"),
  medications: text("medications"),
  injuriesSurgeries: text("injuries_surgeries"),
  currentPains: text("current_pains"),
  familyHistory: text("family_history"),
  medicalClearance: boolean("medical_clearance"),

  // 3. Histórico de atividade física
  pastActivities: text("past_activities"),
  currentActivities: text("current_activities"),
  activityLevel: varchar("activity_level"), // sedentary, moderate, very_active
  currentResistance: varchar("current_resistance"), // low, medium, high
  currentStrength: varchar("current_strength"), // low, medium, high

  // 4. Objetivos
  primaryGoal: text("primary_goal"),
  specificDeadline: text("specific_deadline"),
  targetBodyPart: text("target_body_part"),
  lifestyleChange: boolean("lifestyle_change"),

  // 5. Hábitos de vida
  dailyNutrition: text("daily_nutrition"),
  supplements: text("supplements"),
  sleepQuality: text("sleep_quality"),
  stressLevel: varchar("stress_level"), // low, moderate, high
  smoking: varchar("smoking"), // none, occasional, regular
  alcoholConsumption: varchar("alcohol_consumption"), // none, occasional, regular
  caffeineConsumption: varchar("caffeine_consumption"), // none, moderate, high

  // 6. Avaliação antropométrica
  currentWeight: decimal("current_weight", { precision: 5, scale: 2 }),
  currentHeight: decimal("current_height", { precision: 5, scale: 2 }),
  bmi: decimal("bmi", { precision: 4, scale: 2 }),
  waistCirc: decimal("waist_circ", { precision: 5, scale: 2 }),
  hipCirc: decimal("hip_circ", { precision: 5, scale: 2 }),
  abdomenCirc: decimal("abdomen_circ", { precision: 5, scale: 2 }),
  armCirc: decimal("arm_circ", { precision: 5, scale: 2 }),
  thighCirc: decimal("thigh_circ", { precision: 5, scale: 2 }),
  calfCirc: decimal("calf_circ", { precision: 5, scale: 2 }),
  chestCirc: decimal("chest_circ", { precision: 5, scale: 2 }),
  bodyFatPercentage: decimal("body_fat_percentage", { precision: 4, scale: 2 }),
  leanMass: decimal("lean_mass", { precision: 5, scale: 2 }),
  bodyWater: decimal("body_water", { precision: 4, scale: 2 }),

  // 7. Avaliação de desempenho/condicionamento
  maxPushUps: integer("max_push_ups"),
  maxSquats: integer("max_squats"),
  maxSitUps: integer("max_sit_ups"),
  plankTime: integer("plank_time"), // em segundos
  cardioTest: varchar("cardio_test"), // tipo de teste cardiovascular
  cardioTestResult: varchar("cardio_test_result"), // resultado do teste
  flexibility: varchar("flexibility"), // poor, fair, good, excellent
  postureAssessment: text("posture_assessment"), // desvios observados
  balanceCoordination: varchar("balance_coordination"), // poor, fair, good, excellent

  // 8. Avaliação clínica básica
  bloodPressure: varchar("blood_pressure"),
  restingHeartRate: integer("resting_heart_rate"),
  oxygenSaturation: decimal("oxygen_saturation"),
  subjectiveEffortPerception: text("subjective_effort_perception"),

  // Observações gerais
  additionalNotes: text("additional_notes"),

  assessmentDate: timestamp("assessment_date").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  students: many(students),
  workouts: many(workouts),
}));

export const studentsRelations = relations(students, ({ one, many }) => ({
  personalTrainer: one(users, {
    fields: [students.personalTrainerId],
    references: [users.id],
  }),
  workouts: many(workouts),
  workoutSessions: many(workoutSessions),
  bodyMeasurements: many(bodyMeasurements),
  workoutHistory: many(workoutHistory),
  workoutComments: many(workoutComments),
  physicalAssessments: many(physicalAssessments),
}));

export const workoutsRelations = relations(workouts, ({ one, many }) => ({
  student: one(students, {
    fields: [workouts.studentId],
    references: [students.id],
  }),
  personalTrainer: one(users, {
    fields: [workouts.personalTrainerId],
    references: [users.id],
  }),
  exercises: many(exercises),
  sessions: many(workoutSessions),
}));

export const exerciseTemplatesRelations = relations(
  exerciseTemplates,
  ({ many }) => ({
    exercises: many(exercises),
  })
);

export const exercisesRelations = relations(exercises, ({ one, many }) => ({
  workout: one(workouts, {
    fields: [exercises.workoutId],
    references: [workouts.id],
  }),
  template: one(exerciseTemplates, {
    fields: [exercises.templateId],
    references: [exerciseTemplates.id],
  }),
  performances: many(exercisePerformances),
}));

export const workoutSessionsRelations = relations(
  workoutSessions,
  ({ one, many }) => ({
    workout: one(workouts, {
      fields: [workoutSessions.workoutId],
      references: [workouts.id],
    }),
    student: one(students, {
      fields: [workoutSessions.studentId],
      references: [students.id],
    }),
    performances: many(exercisePerformances),
  })
);

export const exercisePerformancesRelations = relations(
  exercisePerformances,
  ({ one }) => ({
    workoutSession: one(workoutSessions, {
      fields: [exercisePerformances.workoutSessionId],
      references: [workoutSessions.id],
    }),
    exercise: one(exercises, {
      fields: [exercisePerformances.exerciseId],
      references: [exercises.id],
    }),
  })
);

export const bodyMeasurementsRelations = relations(
  bodyMeasurements,
  ({ one }) => ({
    student: one(students, {
      fields: [bodyMeasurements.studentId],
      references: [students.id],
    }),
  })
);

export const workoutHistoryRelations = relations(workoutHistory, ({ one }) => ({
  student: one(students, {
    fields: [workoutHistory.studentId],
    references: [students.id],
  }),
  exercise: one(exercises, {
    fields: [workoutHistory.exerciseId],
    references: [exercises.id],
  }),
  workoutSession: one(workoutSessions, {
    fields: [workoutHistory.workoutSessionId],
    references: [workoutSessions.id],
  }),
}));

export const workoutCommentsRelations = relations(
  workoutComments,
  ({ one }) => ({
    student: one(students, {
      fields: [workoutComments.studentId],
      references: [students.id],
    }),
    workoutSession: one(workoutSessions, {
      fields: [workoutComments.workoutSessionId],
      references: [workoutSessions.id],
    }),
  })
);

export const physicalAssessmentsRelations = relations(
  physicalAssessments,
  ({ one }) => ({
    student: one(students, {
      fields: [physicalAssessments.studentId],
      references: [students.id],
    }),
    personalTrainer: one(users, {
      fields: [physicalAssessments.personalTrainerId],
      references: [users.id],
    }),
  })
);

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertStudentSchema = createInsertSchema(students)
  .omit({
    id: true,
    createdAt: true,
    updatedAt: true,
  })
  .extend({
    weight: z.number().optional(),
    height: z.number().optional(),
  });

export const insertWorkoutSchema = createInsertSchema(workouts).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertExerciseTemplateSchema = createInsertSchema(
  exerciseTemplates
).omit({
  id: true,
  createdAt: true,
});

export const insertExerciseSchema = createInsertSchema(exercises)
  .omit({
    id: true,
    createdAt: true,
  })
  .extend({
    weight: z.string().optional(),
  });

export const insertWorkoutSessionSchema = createInsertSchema(
  workoutSessions
).omit({
  id: true,
});

export const insertExercisePerformanceSchema = createInsertSchema(
  exercisePerformances
).omit({
  id: true,
  createdAt: true,
});

export const insertBodyMeasurementSchema = createInsertSchema(
  bodyMeasurements
).omit({
  id: true,
});

export const insertWorkoutHistorySchema = createInsertSchema(workoutHistory)
  .omit({
    id: true,
    completedAt: true,
  })
  .extend({
    weight: z.string().optional(),
    previousWeight: z.string().optional(),
  });

export const insertWorkoutCommentSchema = createInsertSchema(
  workoutComments
).omit({
  id: true,
  createdAt: true,
});

export const insertPhysicalAssessmentSchema = createInsertSchema(
  physicalAssessments
)
  .omit({
    id: true,
    createdAt: true,
    updatedAt: true,
  })
  .extend({
    // Performance Assessment fields
    maxPushUps: z.number().int().positive().optional(),
    maxSquats: z.number().int().positive().optional(),
    maxSitUps: z.number().int().positive().optional(),
    plankTime: z.number().int().positive().optional(),
    cardioTest: z.string().optional(),
    cardioTestResult: z.string().optional(),
    flexibility: z.enum(["poor", "fair", "good", "excellent"]).optional(),
    postureAssessment: z.string().optional(),
    balanceCoordination: z
      .enum(["poor", "fair", "good", "excellent"])
      .optional(),
    assessmentDate: z
      .string()
      .datetime()
      .optional()
      .transform((val) => {
        return val ? new Date(val) : undefined;
      }),
  });

// Types
export type InsertUser = typeof users.$inferInsert;
export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;
export type InsertStudent = z.infer<typeof insertStudentSchema>;
export type Student = typeof students.$inferSelect;
export type InsertWorkout = z.infer<typeof insertWorkoutSchema>;
export type Workout = typeof workouts.$inferSelect;
export type InsertExerciseTemplate = z.infer<
  typeof insertExerciseTemplateSchema
>;
export type ExerciseTemplate = typeof exerciseTemplates.$inferSelect;
export type InsertExercise = z.infer<typeof insertExerciseSchema>;
export type Exercise = typeof exercises.$inferSelect;
export type InsertWorkoutSession = z.infer<typeof insertWorkoutSessionSchema>;
export type WorkoutSession = typeof workoutSessions.$inferSelect;
export type InsertExercisePerformance = z.infer<
  typeof insertExercisePerformanceSchema
>;
export type ExercisePerformance = typeof exercisePerformances.$inferSelect;
export type InsertBodyMeasurement = z.infer<typeof insertBodyMeasurementSchema>;
export type BodyMeasurement = typeof bodyMeasurements.$inferSelect;
export type InsertWorkoutHistory = z.infer<typeof insertWorkoutHistorySchema>;
export type WorkoutHistory = typeof workoutHistory.$inferSelect;
export type InsertWorkoutComment = z.infer<typeof insertWorkoutCommentSchema>;
export type WorkoutComment = typeof workoutComments.$inferSelect;
export type InsertPhysicalAssessment = z.infer<
  typeof insertPhysicalAssessmentSchema
>;
export type PhysicalAssessment = typeof physicalAssessments.$inferSelect;

// Validation schemas
export const studentSchema = z.object({
  personalTrainerId: z.string().uuid(),
  name: z.string().min(1),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  dateOfBirth: z.string().optional(),
  gender: z.enum(["male", "female"]),
  weight: z.number().optional(),
  height: z.number().optional(),
  goal: z.string().optional(),
  medicalConditions: z.string().optional(),
  status: z.enum(["active", "inactive", "suspended"]).optional(),
  profileImage: z.string().optional(),
});

export const workoutSchema = z.object({
  studentId: z.string().uuid(),
  personalTrainerId: z.string().uuid(),
  name: z.string().min(1),
  category: z.enum([
    "chest-triceps",
    "back-biceps",
    "legs",
    "shoulders",
    "cardio",
    "full-body",
  ]),
  description: z.string().optional(),
  isActive: z.boolean().optional(),
});

export const exerciseSchema = z.object({
  workoutId: z.string().uuid(),
  name: z.string().min(1),
  sets: z.number().int().positive(),
  reps: z.string().min(1), // Can be ranges like "12-15"
  weight: z.number().positive().optional(),
  restTime: z.number().int().optional(), // in seconds
  notes: z.string().optional(),
  order: z.number().int().positive(),
});

export const workoutSessionSchema = z.object({
  workoutId: z.string().uuid(),
  studentId: z.string().uuid(),
  completedAt: z.string().optional(),
  duration: z.number().int().optional(), // in minutes
  notes: z.string().optional(),
});

export const exercisePerformanceSchema = z.object({
  workoutSessionId: z.string().uuid(),
  exerciseId: z.string().uuid(),
  actualSets: z.number().int().optional(),
  actualReps: z.string().optional(),
  actualWeight: z.number().optional(),
  completed: z.boolean().optional(),
});

export const bodyMeasurementSchema = z.object({
  studentId: z.string().uuid(),
  weight: z.number().optional(),
  bodyFat: z.number().optional(),
  muscleMass: z.number().optional(),
  chest: z.number().optional(),
  waist: z.number().optional(),
  hips: z.number().optional(),
  arms: z.number().optional(),
  thighs: z.number().optional(),
});

export const physicalAssessmentSchema = insertPhysicalAssessmentSchema.extend({
  // Performance Assessment fields
  maxPushUps: z.number().int().positive().optional(),
  maxSquats: z.number().int().positive().optional(),
  maxSitUps: z.number().int().positive().optional(),
  plankTime: z.number().int().positive().optional(),
  cardioTest: z.string().optional(),
  cardioTestResult: z.string().optional(),
  flexibility: z.enum(["poor", "fair", "good", "excellent"]).optional(),
  postureAssessment: z.string().optional(),
  balanceCoordination: z.enum(["poor", "fair", "good", "excellent"]).optional(),
});
