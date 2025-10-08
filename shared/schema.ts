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
  real,
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
  // Campos para professores
  crefNumber: varchar("cref_number"),
  crefExpiryDate: timestamp("cref_expiry_date"),
  phone: varchar("phone"),
  dateOfBirth: timestamp("date_of_birth"),
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

export const weekdayEnum = pgEnum("weekday", [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday",
]);

// Enums para Anamnese
export const activityLevelEnum = pgEnum("activity_level", [
  "low",
  "medium",
  "high",
]);
export const goalEnum = pgEnum("goal", [
  "weight_loss",
  "hypertrophy",
  "conditioning",
  "health",
  "other",
]);
export const frequencyEnum = pgEnum("frequency", [
  "never",
  "rarely",
  "sometimes",
  "often",
  "daily",
]);
export const stressLevelEnum = pgEnum("stress_level", [
  "low",
  "moderate",
  "high",
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
  verificationCode: varchar("verification_code"), // Código de verificação de 6 dígitos
  verificationCodeExpiry: timestamp("verification_code_expiry"), // Quando o código expira
  phone: varchar("phone"),
  dateOfBirth: timestamp("date_of_birth"),
  gender: genderEnum("gender").notNull(),
  profession: varchar("profession"),
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
  weekday: weekdayEnum("weekday"), // Dia da semana para o treino
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
  startTime: timestamp("start_time"), // when the workout was started
  completedAt: timestamp("completed_at").defaultNow(),
  duration: integer("duration"), // in minutes
  notes: text("notes"),
});

// Exercise performances (actual performance data)
export const exercisePerformances = pgTable("exercise_performances", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  sessionId: varchar("session_id").notNull(),
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

// Enum para tipos de mudança de peso
export const weightChangeEnum = pgEnum("weight_change_type", [
  "increase",
  "decrease",
  "maintain",
]);

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
  changeType: weightChangeEnum("change_type"), // Tipo de mudança (aumento, diminuição, manutenção)
  percentageChange: decimal("percentage_change", { precision: 5, scale: 2 }), // Porcentagem da mudança
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
  // Medidas corporais
  waistCirc: real("waist_circ"),
  hipCirc: real("hip_circ"),
  chestCirc: real("chest_circ"),
  rightArmContractedCirc: real("right_arm_contracted_circ"),
  rightArmRelaxedCirc: real("right_arm_relaxed_circ"),
  leftArmContractedCirc: real("left_arm_contracted_circ"),
  leftArmRelaxedCirc: real("left_arm_relaxed_circ"),
  rightThighCirc: real("right_thigh_circ"),
  leftThighCirc: real("left_thigh_circ"),
  rightCalfCirc: real("right_calf_circ"),
  leftCalfCirc: real("left_calf_circ"),

  // Dobras cutâneas
  tricepsSkinFold: real("triceps_skin_fold"),
  subscapularSkinFold: real("subscapular_skin_fold"),
  axillaryMidSkinFold: real("axillary_mid_skin_fold"),
  pectoralSkinFold: real("pectoral_skin_fold"),
  suprailiacSkinFold: real("suprailiac_skin_fold"),
  abdominalSkinFold: real("abdominal_skin_fold"),
  thighSkinFold: real("thigh_skin_fold"),

  // Composição corporal
  fatMass: real("fat_mass"),

  // RCQ
  waistHipRatio: real("waist_hip_ratio"),
  waistHipRatioClassification: text("waist_hip_ratio_classification"),

  // Novos campos fisiológicos
  bodyWater: real("body_water"),
  bloodPressure: text("blood_pressure"),
  restingHeartRate: real("resting_heart_rate"),

  // Testes de aptidão física
  subjectiveEffortPerception: text("subjective_effort_perception"),
  maxPushUps: integer("max_push_ups"),
  maxSquats: integer("max_squats"),
  maxSitUps: integer("max_sit_ups"),
  plankTime: integer("plank_time"),
  cardioTest: text("cardio_test"),
  cardioTestResult: text("cardio_test_result"),

  // Avaliações adicionais
  flexibility: text("flexibility"),
  postureAssessment: text("posture_assessment"),
  balanceCoordination: text("balance_coordination"),
  additionalNotes: text("additional_notes"),

  assessmentDate: timestamp("assessment_date"),

  // Circumference measurements
  abdomenCirc: real("abdomen_circ"),
  armCirc: real("arm_circ"),
  thighCirc: real("thigh_circ"),
  calfCirc: real("calf_circ"),

  // Body composition
  bodyFatPercentage: real("body_fat_percentage"),
  leanMass: real("lean_mass"),
  leanMassBody: real("lean_mass_body"),

  // Vital signs
  oxygenSaturation: real("oxygen_saturation"),

  // Gender
  gender: genderEnum("gender"),

  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Physical Assessment History table - stores historical versions of assessments
export const physicalAssessmentHistory = pgTable(
  "physical_assessment_history",
  {
    id: varchar("id")
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    originalAssessmentId: varchar("original_assessment_id")
      .notNull()
      .references(() => physicalAssessments.id),
    studentId: varchar("student_id")
      .notNull()
      .references(() => students.id),
    personalTrainerId: varchar("personal_trainer_id")
      .notNull()
      .references(() => users.id),
    versionNumber: integer("version_number").notNull().default(1),

    // Copy of all assessment data for historical tracking
    currentWeight: decimal("current_weight", { precision: 5, scale: 2 }),
    currentHeight: decimal("current_height", { precision: 5, scale: 2 }),
    bmi: decimal("bmi", { precision: 4, scale: 2 }),
    waistCirc: text("waist_circ"),
    hipCirc: text("hip_circ"),
    chestCirc: text("chest_circ"),
    bodyFatPercentage: real("body_fat_percentage"),
    leanMass: real("lean_mass"),
    assessmentDate: timestamp("assessment_date"),
    createdAt: timestamp("created_at").defaultNow(),
  }
);

// Assessment Photos table
export const assessmentPhotos = pgTable("assessment_photos", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  assessmentId: varchar("assessment_id")
    .notNull()
    .references(() => physicalAssessments.id, { onDelete: "cascade" }),
  studentId: varchar("student_id")
    .notNull()
    .references(() => students.id),
  photoType: varchar("photo_type").notNull(), // 'front', 'side', 'back'
  photoUrl: varchar("photo_url").notNull(), // Caminho para o arquivo
  fileName: varchar("file_name").notNull(),
  fileSize: integer("file_size"), // Tamanho em bytes
  mimeType: varchar("mime_type").notNull(),
  uploadedAt: timestamp("uploaded_at").defaultNow(),
});

// Enum para tipos de conta financeira
export const accountTypeEnum = pgEnum("account_type", [
  "receivable", // Contas a receber
  "payable", // Contas a pagar
]);

// Enum para status de pagamento
export const paymentStatusEnum = pgEnum("payment_status", [
  "pending", // Pendente
  "partial", // Parcialmente pago
  "paid", // Pago
  "overdue", // Em atraso
  "cancelled", // Cancelado
]);

// Enum para categoria de conta
export const accountCategoryEnum = pgEnum("account_category", [
  "student_monthly", // Mensalidade de aluno
  "student_assessment", // Avaliação física
  "student_personal_training", // Personal training
  "rent", // Aluguel
  "equipment", // Equipamentos
  "marketing", // Marketing
  "utilities", // Utilidades (água, luz, etc)
  "insurance", // Seguro
  "other", // Outros
]);

// Enum para métodos de pagamento
export const paymentMethodEnum = pgEnum("payment_method", [
  "cash", // Dinheiro
  "pix", // PIX
  "credit_card", // Cartão de crédito
  "debit_card", // Cartão de débito
  "bank_transfer", // Transferência bancária
  "boleto", // Boleto bancário
]);

// Enum para tipos de evento do calendário
export const calendarEventTypeEnum = pgEnum("calendar_event_type", [
  "training",
  "consultation",
  "assessment",
  "personal",
]);

// Tabela de contas financeiras (contas a pagar e receber)
export const financialAccounts = pgTable("financial_accounts", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  personalTrainerId: varchar("personal_trainer_id")
    .notNull()
    .references(() => users.id),
  studentId: varchar("student_id").references(() => students.id), // Opcional - null para contas não relacionadas a alunos
  type: accountTypeEnum("type").notNull(),
  category: accountCategoryEnum("category").notNull(),
  title: varchar("title").notNull(),
  description: text("description"),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  dueDate: timestamp("due_date").notNull(),
  status: paymentStatusEnum("status").notNull().default("pending"),
  paidAmount: decimal("paid_amount", { precision: 10, scale: 2 }).default("0"),
  paidAt: timestamp("paid_at"),
  installments: integer("installments").default(1), // Número de parcelas
  currentInstallment: integer("current_installment").default(1), // Parcela atual
  isRecurring: boolean("is_recurring").default(false), // Se é recorrente (ex: mensalidade)
  recurringInterval: varchar("recurring_interval"), // monthly, yearly, etc.
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Enum para status de transação online
export const transactionStatusEnum = pgEnum("transaction_status", [
  "pending", // Pendente de processamento
  "processing", // Sendo processado
  "completed", // Completado com sucesso
  "failed", // Falhou
  "cancelled", // Cancelado
  "refunded", // Estornado
]);

// Tabela de pagamentos (histórico de pagamentos realizados)
export const payments = pgTable("payments", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  accountId: varchar("account_id")
    .notNull()
    .references(() => financialAccounts.id, { onDelete: "cascade" }),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  paymentDate: timestamp("payment_date").defaultNow(),
  paymentMethod: varchar("payment_method"), // cash, pix, credit_card, debit_card, bank_transfer, boleto

  // Campos para pagamentos online seguros
  transactionId: varchar("transaction_id").unique(), // ID único da transação no nosso sistema
  providerTransactionId: varchar("provider_transaction_id"), // ID da transação no provedor (Efí, etc)
  providerName: varchar("provider_name"), // efi_bank, mercado_pago, etc
  transactionStatus:
    transactionStatusEnum("transaction_status").default("pending"),

  // Dados do PIX
  pixQrCode: text("pix_qr_code"), // QR Code para pagamento PIX
  pixCopyPaste: text("pix_copy_paste"), // Código PIX copia e cola
  pixExpiresAt: timestamp("pix_expires_at"), // Expiração do PIX

  // Dados do cartão (apenas referências seguras, nunca dados do cartão)
  cardBrand: varchar("card_brand"), // visa, mastercard, etc
  cardLastFour: varchar("card_last_four"), // Últimos 4 dígitos

  // Metadados de segurança
  ipAddress: varchar("ip_address"), // IP do pagador
  userAgent: text("user_agent"), // User agent do navegador

  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Tabela de eventos do calendário
export const calendarEvents = pgTable("calendar_events", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  personalTrainerId: varchar("personal_trainer_id")
    .notNull()
    .references(() => users.id),
  studentId: varchar("student_id").references(() => students.id), // Opcional - pode ser evento pessoal do professor
  title: varchar("title").notNull(),
  description: text("description"),
  startTime: timestamp("start_time").notNull(),
  endTime: timestamp("end_time").notNull(),
  type: calendarEventTypeEnum("type").notNull(),
  location: varchar("location"),
  isAllDay: boolean("is_all_day").default(false),
  reminderSent: boolean("reminder_sent").default(false), // Para controlar se notificação já foi enviada
  googleEventId: varchar("google_event_id"), // Para sincronização com Google Calendar
  outlookEventId: varchar("outlook_event_id"), // Para sincronização com Outlook
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  students: many(students),
  workouts: many(workouts),
  calendarEvents: many(calendarEvents),
  financialAccounts: many(financialAccounts),
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
  calendarEvents: many(calendarEvents),
  financialAccounts: many(financialAccounts),
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
  ({ one, many }) => ({
    student: one(students, {
      fields: [physicalAssessments.studentId],
      references: [students.id],
    }),
    personalTrainer: one(users, {
      fields: [physicalAssessments.personalTrainerId],
      references: [users.id],
    }),
    photos: many(assessmentPhotos),
  })
);

export const assessmentPhotosRelations = relations(
  assessmentPhotos,
  ({ one }) => ({
    assessment: one(physicalAssessments, {
      fields: [assessmentPhotos.assessmentId],
      references: [physicalAssessments.id],
    }),
    student: one(students, {
      fields: [assessmentPhotos.studentId],
      references: [students.id],
    }),
  })
);

export const calendarEventsRelations = relations(calendarEvents, ({ one }) => ({
  personalTrainer: one(users, {
    fields: [calendarEvents.personalTrainerId],
    references: [users.id],
  }),
  student: one(students, {
    fields: [calendarEvents.studentId],
    references: [students.id],
  }),
}));

export const financialAccountsRelations = relations(
  financialAccounts,
  ({ one, many }) => ({
    personalTrainer: one(users, {
      fields: [financialAccounts.personalTrainerId],
      references: [users.id],
    }),
    student: one(students, {
      fields: [financialAccounts.studentId],
      references: [students.id],
    }),
    payments: many(payments),
  })
);

export const paymentsRelations = relations(payments, ({ one }) => ({
  account: one(financialAccounts, {
    fields: [payments.accountId],
    references: [financialAccounts.id],
  }),
}));

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
    dateOfBirth: z
      .union([z.string(), z.date()])
      .optional()
      .transform((val) => {
        if (!val) return undefined;
        return val instanceof Date ? val : new Date(val);
      }),
  });

export const insertWorkoutSchema = createInsertSchema(workouts)
  .omit({
    id: true,
    createdAt: true,
    updatedAt: true,
  })
  .extend({
    weekday: z
      .enum([
        "monday",
        "tuesday",
        "wednesday",
        "thursday",
        "friday",
        "saturday",
        "sunday",
      ])
      .optional(),
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
    changeType: z.enum(["increase", "decrease", "maintain"]).optional(),
    percentageChange: z.string().optional(),
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
  })
  .extend({
    // Numeric fields that should accept numbers
    currentWeight: z.number().positive().optional(),
    currentHeight: z.number().positive().optional(),
    bmi: z.number().positive().optional(),
    abdomenCirc: z.number().positive().optional(),
    armCirc: z.number().positive().optional(),
    thighCirc: z.number().positive().optional(),
    calfCirc: z.number().positive().optional(),
    bodyFatPercentage: z.number().positive().optional(),
    leanMass: z.number().positive().optional(),
    leanMassBody: z.number().positive().optional(),
    oxygenSaturation: z.number().positive().optional(),
    assessmentDate: z
      .string()
      .datetime()
      .optional()
      .or(z.date().optional())
      .transform((val) => {
        if (!val) return undefined;
        return val instanceof Date ? val : new Date(val);
      }),
    // Performance Assessment fields (keeping only once)
    maxPushUps: z.number().int().nonnegative().optional(),
    maxSquats: z.number().int().nonnegative().optional(),
    maxSitUps: z.number().int().nonnegative().optional(),
    plankTime: z.number().int().nonnegative().optional(),
    cardioTest: z.string().optional(),
    cardioTestResult: z.string().optional(),
    flexibility: z.enum(["poor", "fair", "good", "excellent"]).optional(),
    postureAssessment: z.string().optional(),
    balanceCoordination: z
      .enum(["poor", "fair", "good", "excellent"])
      .optional(),
    additionalNotes: z.string().optional(),
    // Gender
    gender: z.enum(["male", "female"]).optional(),
  });

export const insertAssessmentPhotoSchema = createInsertSchema(
  assessmentPhotos
).omit({
  id: true,
  uploadedAt: true,
});

export const insertPhysicalAssessmentHistorySchema = createInsertSchema(
  physicalAssessmentHistory
)
  .omit({
    id: true,
    createdAt: true,
  })
  .extend({
    currentWeight: z.string().optional(),
    currentHeight: z.string().optional(),
    bmi: z.string().optional(),
    bodyFatPercentage: z.string().optional(),
    leanMass: z.string().optional(),
    assessmentDate: z
      .string()
      .datetime()
      .optional()
      .or(z.date().optional())
      .transform((val) => {
        if (!val) return undefined;
        return val instanceof Date ? val : new Date(val);
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
export type InsertAssessmentPhoto = z.infer<typeof insertAssessmentPhotoSchema>;
export type AssessmentPhoto = typeof assessmentPhotos.$inferSelect;

export const insertCalendarEventSchema = createInsertSchema(calendarEvents)
  .omit({
    id: true,
    createdAt: true,
    updatedAt: true,
  })
  .extend({
    startTime: z
      .string()
      .datetime()
      .transform((str) => new Date(str)),
    endTime: z
      .string()
      .datetime()
      .transform((str) => new Date(str)),
  });

export type InsertCalendarEvent = z.infer<typeof insertCalendarEventSchema>;
export type CalendarEvent = typeof calendarEvents.$inferSelect;
export type InsertPhysicalAssessmentHistory = z.infer<
  typeof insertPhysicalAssessmentHistorySchema
>;
export type PhysicalAssessmentHistory =
  typeof physicalAssessmentHistory.$inferSelect;

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
  id: z.string().uuid().optional(),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional(),
});

// Financial schemas
export const insertFinancialAccountSchema = createInsertSchema(
  financialAccounts
)
  .omit({
    id: true,
    createdAt: true,
    updatedAt: true,
  })
  .extend({
    amount: z.number().positive(),
    paidAmount: z.number().min(0).optional(),
    dueDate: z
      .string()
      .datetime()
      .or(z.date())
      .transform((val) => {
        return val instanceof Date ? val : new Date(val);
      }),
    paidAt: z
      .string()
      .datetime()
      .or(z.date())
      .optional()
      .transform((val) => {
        if (!val) return undefined;
        return val instanceof Date ? val : new Date(val);
      }),
    installments: z.number().int().positive().optional(),
    currentInstallment: z.number().int().positive().optional(),
  });

export const insertPaymentSchema = createInsertSchema(payments)
  .omit({
    id: true,
    createdAt: true,
  })
  .extend({
    amount: z.number().positive(),
    paymentDate: z
      .string()
      .datetime()
      .or(z.date())
      .optional()
      .transform((val) => {
        if (!val) return undefined;
        return val instanceof Date ? val : new Date(val);
      }),
    transactionId: z.string().optional(),
    providerTransactionId: z.string().optional(),
    providerName: z.string().optional(),
    pixExpiresAt: z
      .string()
      .datetime()
      .or(z.date())
      .optional()
      .transform((val) => {
        if (!val) return undefined;
        return val instanceof Date ? val : new Date(val);
      }),
  });

// Financial types
export type InsertFinancialAccount = z.infer<
  typeof insertFinancialAccountSchema
>;
export type FinancialAccount = typeof financialAccounts.$inferSelect;
export type InsertPayment = z.infer<typeof insertPaymentSchema>;
export type Payment = typeof payments.$inferSelect;

// Frontend-friendly types with number conversion
export type FinancialAccountFrontend = Omit<
  FinancialAccount,
  "amount" | "paidAmount"
> & {
  amount: number;
  paidAmount: number;
};

// Enum para tipos de foto postural
export const posturePhotoTypeEnum = pgEnum("posture_photo_type", [
  "front", // frente
  "back", // costas
  "side_left", // lado esquerdo
  "side_right", // lado direito
]);

// Enum para articulações
export const jointEnum = pgEnum("joint", [
  "head",
  "neck",
  "shoulder_left",
  "shoulder_right",
  "elbow_left",
  "elbow_right",
  "wrist_left",
  "wrist_right",
  "hip_left",
  "hip_right",
  "knee_left",
  "knee_right",
  "ankle_left",
  "ankle_right",
  "spine_cervical",
  "spine_thoracic",
  "spine_lumbar",
]);

// Enum para severidade dos desvios posturais
export const severityEnum = pgEnum("severity", [
  "normal", // normal
  "mild", // leve
  "moderate", // moderado
  "severe", // severo
]);

// Tabela de avaliações posturais
export const postureAssessments = pgTable("posture_assessments", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  studentId: varchar("student_id")
    .notNull()
    .references(() => students.id, { onDelete: "cascade" }),
  personalTrainerId: varchar("personal_trainer_id")
    .notNull()
    .references(() => users.id),
  title: varchar("title").notNull(),
  notes: text("notes"),
  aiAnalysis: text("ai_analysis"), // Análise completa da IA
  aiRecommendations: text("ai_recommendations"), // Recomendações da IA
  aiDeviations: text("ai_deviations"), // JSON com desvios identificados pela IA
  correctedVisualizationUrl: varchar("corrected_visualization_url"), // URL da imagem corrigida
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Tabela de fotos posturais
export const posturePhotos = pgTable("posture_photos", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  assessmentId: varchar("assessment_id")
    .notNull()
    .references(() => postureAssessments.id, { onDelete: "cascade" }),
  photoType: posturePhotoTypeEnum("photo_type").notNull(),
  photoUrl: varchar("photo_url").notNull(),
  fileName: varchar("file_name").notNull(),
  fileSize: integer("file_size"),
  mimeType: varchar("mime_type").notNull(),
  uploadedAt: timestamp("uploaded_at").defaultNow(),
});

// Tabela de observações por articulação
export const postureObservations = pgTable("posture_observations", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  assessmentId: varchar("assessment_id")
    .notNull()
    .references(() => postureAssessments.id, { onDelete: "cascade" }),
  joint: jointEnum("joint").notNull(),
  observation: varchar("observation").notNull(), // Ex: "ombro caído", "muito para frente"
  severity: severityEnum("severity").notNull().default("mild"),
  customObservation: text("custom_observation"), // Observação personalizada do professor
  isCustom: boolean("is_custom").default(false), // Se foi uma observação customizada
  createdAt: timestamp("created_at").defaultNow(),
});

// Tabela de opções pré-definidas por articulação
export const postureOptions = pgTable("posture_options", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  joint: jointEnum("joint").notNull(),
  optionText: varchar("option_text").notNull(), // Ex: "Ombro caído", "Cabeça muito para frente"
  description: text("description"), // Descrição mais detalhada
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

// Tabela de Anamnese
export const anamneses = pgTable("anamneses", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  studentId: varchar("student_id")
    .notNull()
    .references(() => students.id, { onDelete: "cascade" }),
  personalTrainerId: varchar("personal_trainer_id")
    .notNull()
    .references(() => users.id),

  // 1. Identificação (preenchido automaticamente se vier do cadastro)
  assessmentDate: timestamp("assessment_date").defaultNow(),

  // 2. Objetivo Principal
  primaryGoal: goalEnum("primary_goal"),
  otherGoal: text("other_goal"),
  goalTimeframe: varchar("goal_timeframe"),
  hasTrainedBefore: boolean("has_trained_before"),
  timeInactive: varchar("time_inactive"),

  // 3. Histórico de Atividade Física
  previousActivities: text("previous_activities"),
  trainingFrequency: frequencyEnum("training_frequency"),
  hadProfessionalGuidance: boolean("had_professional_guidance"),
  currentFitnessLevel: activityLevelEnum("current_fitness_level"),
  doesWarmupStretching: boolean("does_warmup_stretching"),

  // 4. Histórico de Saúde
  hasDiagnosedDiseases: boolean("has_diagnosed_diseases"),
  diagnosedDiseases: text("diagnosed_diseases"),
  takesContinuousMedication: boolean("takes_continuous_medication"),
  medications: text("medications"),
  hadSurgery: boolean("had_surgery"),
  surgeryDetails: text("surgery_details"),
  hasHypertensionHistory: boolean("has_hypertension_history"),
  hasDiabetesHistory: boolean("has_diabetes_history"),
  hasHeartProblemsHistory: boolean("has_heart_problems_history"),
  painOrLimitation: text("pain_or_limitation"),
  hadDizzinessFainting: boolean("had_dizziness_fainting"),

  // 5. Histórico Familiar
  familyHeartDisease: boolean("family_heart_disease"),
  familyHypertension: boolean("family_hypertension"),
  familyDiabetes: boolean("family_diabetes"),
  geneticConditions: text("genetic_conditions"),

  // 6. Hábitos de Vida
  dailyNutrition: text("daily_nutrition"),
  waterIntakeLiters: decimal("water_intake_liters", { precision: 3, scale: 1 }),
  consumesAlcohol: boolean("consumes_alcohol"),
  alcoholFrequency: frequencyEnum("alcohol_frequency"),
  smokes: boolean("smokes"),
  smokingDuration: varchar("smoking_duration"),
  sleepHoursPerNight: decimal("sleep_hours_per_night", {
    precision: 3,
    scale: 1,
  }),
  stressLevel: stressLevelEnum("stress_level"),

  // 7. Rotina e Disponibilidade
  weeklyTrainingFrequency: integer("weekly_training_frequency"), // Quantas vezes por semana
  availableDaysAndTimes: text("available_days_and_times"), // Dias e horários disponíveis
  preferredTrainingLocation: varchar("preferred_training_location"), // academia, casa, ar_livre
  availableEquipment: text("available_equipment"), // Equipamentos disponíveis

  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Relations para avaliação postural
export const postureAssessmentsRelations = relations(
  postureAssessments,
  ({ one, many }) => ({
    student: one(students, {
      fields: [postureAssessments.studentId],
      references: [students.id],
    }),
    personalTrainer: one(users, {
      fields: [postureAssessments.personalTrainerId],
      references: [users.id],
    }),
    photos: many(posturePhotos),
    observations: many(postureObservations),
  })
);

export const posturePhotosRelations = relations(posturePhotos, ({ one }) => ({
  assessment: one(postureAssessments, {
    fields: [posturePhotos.assessmentId],
    references: [postureAssessments.id],
  }),
}));

export const postureObservationsRelations = relations(
  postureObservations,
  ({ one }) => ({
    assessment: one(postureAssessments, {
      fields: [postureObservations.assessmentId],
      references: [postureAssessments.id],
    }),
  })
);

// Insert schemas para avaliação postural
export const insertPostureAssessmentSchema = createInsertSchema(
  postureAssessments
).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertPosturePhotoSchema = createInsertSchema(posturePhotos).omit({
  id: true,
  uploadedAt: true,
});

export const insertPostureObservationSchema = createInsertSchema(
  postureObservations
).omit({
  id: true,
  createdAt: true,
});

export const insertPostureOptionSchema = createInsertSchema(
  postureOptions
).omit({
  id: true,
  createdAt: true,
});

// Types para avaliação postural
export type PostureAssessment = typeof postureAssessments.$inferSelect;
export type InsertPostureAssessment = z.infer<
  typeof insertPostureAssessmentSchema
>;
export type PosturePhoto = typeof posturePhotos.$inferSelect;
export type InsertPosturePhoto = z.infer<typeof insertPosturePhotoSchema>;
export type PostureObservation = typeof postureObservations.$inferSelect;
export type InsertPostureObservation = z.infer<
  typeof insertPostureObservationSchema
>;
export type PostureOption = typeof postureOptions.$inferSelect;
export type InsertPostureOption = z.infer<typeof insertPostureOptionSchema>;

// Relations para Anamnese
export const anamnesesRelations = relations(anamneses, ({ one }) => ({
  student: one(students, {
    fields: [anamneses.studentId],
    references: [students.id],
  }),
  personalTrainer: one(users, {
    fields: [anamneses.personalTrainerId],
    references: [users.id],
  }),
}));

// Insert schemas para Anamnese
export const insertAnamneseSchema = createInsertSchema(anamneses).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Types para Anamnese
export type Anamnese = typeof anamneses.$inferSelect;
export type InsertAnamnese = z.infer<typeof insertAnamneseSchema>;
