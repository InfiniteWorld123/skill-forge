import { relations, sql } from "drizzle-orm";
import {
  bigint,
  boolean,
  check,
  index,
  integer,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

export const mediaKindEnum = pgEnum("media_kind", [
  "image",
  "video",
  "document",
  "certificate_pdf",
  "other",
]);

export const courseLevelEnum = pgEnum("course_level", [
  "beginner",
  "intermediate",
  "advanced",
]);

export const courseStatusEnum = pgEnum("course_status", [
  "draft",
  "published",
  "archived",
]);

export const currencyEnum = pgEnum("currency", ["EUR", "USD"]);

export const lessonTypeEnum = pgEnum("lesson_type", ["video", "text", "quiz"]);

export const cartStatusEnum = pgEnum("cart_status", [
  "active",
  "checked_out",
  "abandoned",
]);

export const orderStatusEnum = pgEnum("order_status", [
  "pending",
  "paid",
  "failed",
  "refunded",
]);

export const paymentProviderEnum = pgEnum("payment_provider", [
  "stripe",
  "paypal",
  "sepa_bank_transfer",
  "bank_transfer",
]);

export const paymentStatusEnum = pgEnum("payment_status", [
  "pending",
  "succeeded",
  "failed",
  "refunded",
]);

export const enrollmentStatusEnum = pgEnum("enrollment_status", [
  "active",
  "completed",
  "refunded",
  "revoked",
]);

export const questionStatusEnum = pgEnum("question_status", [
  "open",
  "answered",
  "closed",
]);

export const user = pgTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("email_verified").default(false).notNull(),
  image: text("image"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => /* @__PURE__ */ new Date())
    .notNull(),
});

export const session = pgTable(
  "session",
  {
    id: text("id").primaryKey(),
    expiresAt: timestamp("expires_at").notNull(),
    token: text("token").notNull().unique(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
  },
  (table) => [index("session_userId_idx").on(table.userId)],
);

export const account = pgTable(
  "account",
  {
    id: text("id").primaryKey(),
    accountId: text("account_id").notNull(),
    providerId: text("provider_id").notNull(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    accessToken: text("access_token"),
    refreshToken: text("refresh_token"),
    idToken: text("id_token"),
    accessTokenExpiresAt: timestamp("access_token_expires_at"),
    refreshTokenExpiresAt: timestamp("refresh_token_expires_at"),
    scope: text("scope"),
    password: text("password"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (table) => [index("account_userId_idx").on(table.userId)],
);

export const verification = pgTable(
  "verification",
  {
    id: text("id").primaryKey(),
    identifier: text("identifier").notNull(),
    value: text("value").notNull(),
    expiresAt: timestamp("expires_at").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (table) => [index("verification_identifier_idx").on(table.identifier)],
);

export const studentProfile = pgTable(
  "student_profile",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    headline: text("headline"),
    bio: text("bio"),
    country: text("country"),
    timezone: text("timezone"),
    learningGoals: text("learning_goals"),
    websiteUrl: text("website_url"),
    linkedinUrl: text("linkedin_url"),
    githubUrl: text("github_url"),
    isPublic: boolean("is_public").default(false).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (table) => [uniqueIndex("student_profile_user_id_unique").on(table.userId)],
);

export const teacherProfile = pgTable(
  "teacher_profile",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    headline: text("headline"),
    bio: text("bio"),
    expertise: text("expertise"),
    experience: text("experience"),
    education: text("education"),
    websiteUrl: text("website_url"),
    linkedinUrl: text("linkedin_url"),
    githubUrl: text("github_url"),
    youtubeUrl: text("youtube_url"),
    payoutEmail: text("payout_email"),
    isPublic: boolean("is_public").default(true).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (table) => [uniqueIndex("teacher_profile_user_id_unique").on(table.userId)],
);

export const mediaAsset = pgTable(
  "media_asset",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    ownerId: text("owner_id").references(() => user.id, { onDelete: "set null" }),
    kind: mediaKindEnum("kind").default("other").notNull(),
    provider: text("provider").notNull(),
    providerKey: text("provider_key").notNull(),
    url: text("url").notNull(),
    mimeType: text("mime_type"),
    sizeBytes: bigint("size_bytes", { mode: "number" }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("media_asset_owner_id_idx").on(table.ownerId),
    uniqueIndex("media_asset_provider_key_unique").on(table.provider, table.providerKey),
  ],
);

export const courseCategory = pgTable(
  "course_category",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    name: text("name").notNull(),
    slug: text("slug").notNull(),
    description: text("description"),
    isActive: boolean("is_active").default(true).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (table) => [
    uniqueIndex("course_category_name_unique").on(table.name),
    uniqueIndex("course_category_slug_unique").on(table.slug),
  ],
);

export const tag = pgTable(
  "tag",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    name: text("name").notNull(),
    slug: text("slug").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (table) => [
    uniqueIndex("tag_name_unique").on(table.name),
    uniqueIndex("tag_slug_unique").on(table.slug),
  ],
);

export const course = pgTable(
  "course",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    teacherProfileId: uuid("teacher_profile_id")
      .notNull()
      .references(() => teacherProfile.id, { onDelete: "restrict" }),
    categoryId: uuid("category_id").references(() => courseCategory.id, {
      onDelete: "set null",
    }),
    thumbnailAssetId: uuid("thumbnail_asset_id").references(() => mediaAsset.id, {
      onDelete: "set null",
    }),
    title: text("title").notNull(),
    slug: text("slug").notNull(),
    shortDescription: text("short_description"),
    description: text("description"),
    level: courseLevelEnum("level").default("beginner").notNull(),
    language: text("language").default("English").notNull(),
    status: courseStatusEnum("status").default("draft").notNull(),
    priceCents: integer("price_cents").default(0).notNull(),
    currency: currencyEnum("currency").default("EUR").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
    publishedAt: timestamp("published_at"),
    archivedAt: timestamp("archived_at"),
  },
  (table) => [
    uniqueIndex("course_slug_unique").on(table.slug),
    index("course_teacher_profile_id_idx").on(table.teacherProfileId),
    index("course_category_id_idx").on(table.categoryId),
    index("course_status_idx").on(table.status),
    index("course_level_idx").on(table.level),
    index("course_language_idx").on(table.language),
    index("course_price_currency_idx").on(table.priceCents, table.currency),
    check("course_price_cents_non_negative", sql`${table.priceCents} >= 0`),
  ],
);

export const courseTag = pgTable(
  "course_tag",
  {
    courseId: uuid("course_id")
      .notNull()
      .references(() => course.id, { onDelete: "cascade" }),
    tagId: uuid("tag_id")
      .notNull()
      .references(() => tag.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("course_tag_course_id_tag_id_unique").on(table.courseId, table.tagId),
    index("course_tag_tag_id_idx").on(table.tagId),
  ],
);

export const courseSection = pgTable(
  "course_section",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    courseId: uuid("course_id")
      .notNull()
      .references(() => course.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    description: text("description"),
    position: integer("position").default(0).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (table) => [
    index("course_section_course_id_idx").on(table.courseId),
    uniqueIndex("course_section_course_id_position_unique").on(table.courseId, table.position),
  ],
);

export const lesson = pgTable(
  "lesson",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    sectionId: uuid("section_id")
      .notNull()
      .references(() => courseSection.id, { onDelete: "cascade" }),
    videoAssetId: uuid("video_asset_id").references(() => mediaAsset.id, {
      onDelete: "set null",
    }),
    title: text("title").notNull(),
    description: text("description"),
    type: lessonTypeEnum("type").default("video").notNull(),
    textContent: text("text_content"),
    durationSeconds: integer("duration_seconds"),
    position: integer("position").default(0).notNull(),
    isPreview: boolean("is_preview").default(false).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (table) => [
    index("lesson_section_id_idx").on(table.sectionId),
    index("lesson_type_idx").on(table.type),
    uniqueIndex("lesson_section_id_position_unique").on(table.sectionId, table.position),
    check(
      "lesson_duration_seconds_non_negative",
      sql`${table.durationSeconds} IS NULL OR ${table.durationSeconds} >= 0`,
    ),
  ],
);

export const quizQuestion = pgTable(
  "quiz_question",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    lessonId: uuid("lesson_id")
      .notNull()
      .references(() => lesson.id, { onDelete: "cascade" }),
    prompt: text("prompt").notNull(),
    explanation: text("explanation"),
    position: integer("position").default(0).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (table) => [
    index("quiz_question_lesson_id_idx").on(table.lessonId),
    uniqueIndex("quiz_question_lesson_id_position_unique").on(table.lessonId, table.position),
  ],
);

export const quizOption = pgTable(
  "quiz_option",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    questionId: uuid("question_id")
      .notNull()
      .references(() => quizQuestion.id, { onDelete: "cascade" }),
    text: text("text").notNull(),
    isCorrect: boolean("is_correct").default(false).notNull(),
    position: integer("position").default(0).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (table) => [
    index("quiz_option_question_id_idx").on(table.questionId),
    uniqueIndex("quiz_option_question_id_position_unique").on(table.questionId, table.position),
  ],
);

export const cart = pgTable(
  "cart",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    status: cartStatusEnum("status").default("active").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (table) => [
    index("cart_user_id_idx").on(table.userId),
    uniqueIndex("cart_active_user_id_unique")
      .on(table.userId)
      .where(sql`${table.status} = 'active'`),
  ],
);

export const cartItem = pgTable(
  "cart_item",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    cartId: uuid("cart_id")
      .notNull()
      .references(() => cart.id, { onDelete: "cascade" }),
    courseId: uuid("course_id")
      .notNull()
      .references(() => course.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("cart_item_cart_id_idx").on(table.cartId),
    index("cart_item_course_id_idx").on(table.courseId),
    uniqueIndex("cart_item_cart_id_course_id_unique").on(table.cartId, table.courseId),
  ],
);

export const purchaseOrder = pgTable(
  "purchase_order",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "restrict" }),
    status: orderStatusEnum("status").default("pending").notNull(),
    subtotalCents: integer("subtotal_cents").default(0).notNull(),
    totalCents: integer("total_cents").default(0).notNull(),
    currency: currencyEnum("currency").default("EUR").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
    paidAt: timestamp("paid_at"),
    refundedAt: timestamp("refunded_at"),
  },
  (table) => [
    index("purchase_order_user_id_idx").on(table.userId),
    index("purchase_order_status_idx").on(table.status),
    index("purchase_order_user_id_status_idx").on(table.userId, table.status),
    check("purchase_order_subtotal_cents_non_negative", sql`${table.subtotalCents} >= 0`),
    check("purchase_order_total_cents_non_negative", sql`${table.totalCents} >= 0`),
  ],
);

export const purchaseOrderItem = pgTable(
  "purchase_order_item",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    orderId: uuid("order_id")
      .notNull()
      .references(() => purchaseOrder.id, { onDelete: "cascade" }),
    courseId: uuid("course_id")
      .notNull()
      .references(() => course.id, { onDelete: "restrict" }),
    titleSnapshot: text("title_snapshot").notNull(),
    priceCents: integer("price_cents").default(0).notNull(),
    currency: currencyEnum("currency").default("EUR").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("purchase_order_item_order_id_idx").on(table.orderId),
    index("purchase_order_item_course_id_idx").on(table.courseId),
    uniqueIndex("purchase_order_item_order_id_course_id_unique").on(
      table.orderId,
      table.courseId,
    ),
    check(
      "purchase_order_item_price_cents_non_negative",
      sql`${table.priceCents} >= 0`,
    ),
  ],
);

export const payment = pgTable(
  "payment",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    orderId: uuid("order_id")
      .notNull()
      .references(() => purchaseOrder.id, { onDelete: "cascade" }),
    provider: paymentProviderEnum("provider").default("stripe").notNull(),
    status: paymentStatusEnum("status").default("pending").notNull(),
    amountCents: integer("amount_cents").default(0).notNull(),
    currency: currencyEnum("currency").default("EUR").notNull(),
    providerCheckoutId: text("provider_checkout_id"),
    providerPaymentId: text("provider_payment_id"),
    providerCustomerId: text("provider_customer_id"),
    rawProviderStatus: text("raw_provider_status"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (table) => [
    index("payment_order_id_idx").on(table.orderId),
    index("payment_provider_status_idx").on(table.provider, table.status),
    uniqueIndex("payment_provider_checkout_id_unique").on(
      table.provider,
      table.providerCheckoutId,
    ),
    uniqueIndex("payment_provider_payment_id_unique").on(
      table.provider,
      table.providerPaymentId,
    ),
    check("payment_amount_cents_non_negative", sql`${table.amountCents} >= 0`),
  ],
);

export const enrollment = pgTable(
  "enrollment",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    courseId: uuid("course_id")
      .notNull()
      .references(() => course.id, { onDelete: "restrict" }),
    orderItemId: uuid("order_item_id").references(() => purchaseOrderItem.id, {
      onDelete: "set null",
    }),
    status: enrollmentStatusEnum("status").default("active").notNull(),
    enrolledAt: timestamp("enrolled_at").defaultNow().notNull(),
    completedAt: timestamp("completed_at"),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (table) => [
    index("enrollment_user_id_idx").on(table.userId),
    index("enrollment_course_id_idx").on(table.courseId),
    index("enrollment_status_idx").on(table.status),
    uniqueIndex("enrollment_user_id_course_id_unique").on(table.userId, table.courseId),
  ],
);

export const lessonProgress = pgTable(
  "lesson_progress",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    enrollmentId: uuid("enrollment_id")
      .notNull()
      .references(() => enrollment.id, { onDelete: "cascade" }),
    lessonId: uuid("lesson_id")
      .notNull()
      .references(() => lesson.id, { onDelete: "cascade" }),
    completedAt: timestamp("completed_at").defaultNow().notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (table) => [
    index("lesson_progress_enrollment_id_idx").on(table.enrollmentId),
    index("lesson_progress_lesson_id_idx").on(table.lessonId),
    uniqueIndex("lesson_progress_enrollment_id_lesson_id_unique").on(
      table.enrollmentId,
      table.lessonId,
    ),
  ],
);

export const certificate = pgTable(
  "certificate",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    enrollmentId: uuid("enrollment_id")
      .notNull()
      .references(() => enrollment.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    courseId: uuid("course_id")
      .notNull()
      .references(() => course.id, { onDelete: "restrict" }),
    pdfAssetId: uuid("pdf_asset_id").references(() => mediaAsset.id, {
      onDelete: "set null",
    }),
    certificateCode: text("certificate_code").notNull(),
    issuedAt: timestamp("issued_at").defaultNow().notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("certificate_enrollment_id_unique").on(table.enrollmentId),
    uniqueIndex("certificate_code_unique").on(table.certificateCode),
    index("certificate_user_id_idx").on(table.userId),
    index("certificate_course_id_idx").on(table.courseId),
  ],
);

export const wishlistItem = pgTable(
  "wishlist_item",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    courseId: uuid("course_id")
      .notNull()
      .references(() => course.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("wishlist_item_user_id_idx").on(table.userId),
    index("wishlist_item_course_id_idx").on(table.courseId),
    uniqueIndex("wishlist_item_user_id_course_id_unique").on(table.userId, table.courseId),
  ],
);

export const courseReview = pgTable(
  "course_review",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    enrollmentId: uuid("enrollment_id")
      .notNull()
      .references(() => enrollment.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    courseId: uuid("course_id")
      .notNull()
      .references(() => course.id, { onDelete: "cascade" }),
    rating: integer("rating").notNull(),
    title: text("title"),
    body: text("body"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (table) => [
    index("course_review_course_id_idx").on(table.courseId),
    index("course_review_user_id_idx").on(table.userId),
    uniqueIndex("course_review_enrollment_id_unique").on(table.enrollmentId),
    uniqueIndex("course_review_user_id_course_id_unique").on(table.userId, table.courseId),
    check("course_review_rating_range", sql`${table.rating} BETWEEN 1 AND 5`),
  ],
);

export const lessonQuestion = pgTable(
  "lesson_question",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    lessonId: uuid("lesson_id")
      .notNull()
      .references(() => lesson.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    acceptedAnswerId: uuid("accepted_answer_id"),
    status: questionStatusEnum("status").default("open").notNull(),
    title: text("title").notNull(),
    body: text("body").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (table) => [
    index("lesson_question_lesson_id_idx").on(table.lessonId),
    index("lesson_question_user_id_idx").on(table.userId),
    index("lesson_question_status_idx").on(table.status),
  ],
);

export const lessonAnswer = pgTable(
  "lesson_answer",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    questionId: uuid("question_id")
      .notNull()
      .references(() => lessonQuestion.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    body: text("body").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (table) => [
    index("lesson_answer_question_id_idx").on(table.questionId),
    index("lesson_answer_user_id_idx").on(table.userId),
  ],
);

export const userRelations = relations(user, ({ one, many }) => ({
  sessions: many(session),
  accounts: many(account),
  studentProfile: one(studentProfile),
  teacherProfile: one(teacherProfile),
  mediaAssets: many(mediaAsset),
  carts: many(cart),
  purchaseOrders: many(purchaseOrder),
  enrollments: many(enrollment),
  certificates: many(certificate),
  wishlistItems: many(wishlistItem),
  courseReviews: many(courseReview),
  lessonQuestions: many(lessonQuestion),
  lessonAnswers: many(lessonAnswer),
}));

export const sessionRelations = relations(session, ({ one }) => ({
  user: one(user, {
    fields: [session.userId],
    references: [user.id],
  }),
}));

export const accountRelations = relations(account, ({ one }) => ({
  user: one(user, {
    fields: [account.userId],
    references: [user.id],
  }),
}));

export const studentProfileRelations = relations(studentProfile, ({ one }) => ({
  user: one(user, {
    fields: [studentProfile.userId],
    references: [user.id],
  }),
}));

export const teacherProfileRelations = relations(teacherProfile, ({ one, many }) => ({
  user: one(user, {
    fields: [teacherProfile.userId],
    references: [user.id],
  }),
  courses: many(course),
}));

export const mediaAssetRelations = relations(mediaAsset, ({ one, many }) => ({
  owner: one(user, {
    fields: [mediaAsset.ownerId],
    references: [user.id],
  }),
  thumbnailCourses: many(course),
  videoLessons: many(lesson),
  certificates: many(certificate),
}));

export const courseCategoryRelations = relations(courseCategory, ({ many }) => ({
  courses: many(course),
}));

export const tagRelations = relations(tag, ({ many }) => ({
  courseTags: many(courseTag),
}));

export const courseRelations = relations(course, ({ one, many }) => ({
  teacherProfile: one(teacherProfile, {
    fields: [course.teacherProfileId],
    references: [teacherProfile.id],
  }),
  category: one(courseCategory, {
    fields: [course.categoryId],
    references: [courseCategory.id],
  }),
  thumbnailAsset: one(mediaAsset, {
    fields: [course.thumbnailAssetId],
    references: [mediaAsset.id],
  }),
  courseTags: many(courseTag),
  sections: many(courseSection),
  cartItems: many(cartItem),
  orderItems: many(purchaseOrderItem),
  enrollments: many(enrollment),
  certificates: many(certificate),
  wishlistItems: many(wishlistItem),
  reviews: many(courseReview),
}));

export const courseTagRelations = relations(courseTag, ({ one }) => ({
  course: one(course, {
    fields: [courseTag.courseId],
    references: [course.id],
  }),
  tag: one(tag, {
    fields: [courseTag.tagId],
    references: [tag.id],
  }),
}));

export const courseSectionRelations = relations(courseSection, ({ one, many }) => ({
  course: one(course, {
    fields: [courseSection.courseId],
    references: [course.id],
  }),
  lessons: many(lesson),
}));

export const lessonRelations = relations(lesson, ({ one, many }) => ({
  section: one(courseSection, {
    fields: [lesson.sectionId],
    references: [courseSection.id],
  }),
  videoAsset: one(mediaAsset, {
    fields: [lesson.videoAssetId],
    references: [mediaAsset.id],
  }),
  quizQuestions: many(quizQuestion),
  progressRecords: many(lessonProgress),
  questions: many(lessonQuestion),
}));

export const quizQuestionRelations = relations(quizQuestion, ({ one, many }) => ({
  lesson: one(lesson, {
    fields: [quizQuestion.lessonId],
    references: [lesson.id],
  }),
  options: many(quizOption),
}));

export const quizOptionRelations = relations(quizOption, ({ one }) => ({
  question: one(quizQuestion, {
    fields: [quizOption.questionId],
    references: [quizQuestion.id],
  }),
}));

export const cartRelations = relations(cart, ({ one, many }) => ({
  user: one(user, {
    fields: [cart.userId],
    references: [user.id],
  }),
  items: many(cartItem),
}));

export const cartItemRelations = relations(cartItem, ({ one }) => ({
  cart: one(cart, {
    fields: [cartItem.cartId],
    references: [cart.id],
  }),
  course: one(course, {
    fields: [cartItem.courseId],
    references: [course.id],
  }),
}));

export const purchaseOrderRelations = relations(purchaseOrder, ({ one, many }) => ({
  user: one(user, {
    fields: [purchaseOrder.userId],
    references: [user.id],
  }),
  items: many(purchaseOrderItem),
  payments: many(payment),
}));

export const purchaseOrderItemRelations = relations(
  purchaseOrderItem,
  ({ one, many }) => ({
    order: one(purchaseOrder, {
      fields: [purchaseOrderItem.orderId],
      references: [purchaseOrder.id],
    }),
    course: one(course, {
      fields: [purchaseOrderItem.courseId],
      references: [course.id],
    }),
    enrollments: many(enrollment),
  }),
);

export const paymentRelations = relations(payment, ({ one }) => ({
  order: one(purchaseOrder, {
    fields: [payment.orderId],
    references: [purchaseOrder.id],
  }),
}));

export const enrollmentRelations = relations(enrollment, ({ one, many }) => ({
  user: one(user, {
    fields: [enrollment.userId],
    references: [user.id],
  }),
  course: one(course, {
    fields: [enrollment.courseId],
    references: [course.id],
  }),
  orderItem: one(purchaseOrderItem, {
    fields: [enrollment.orderItemId],
    references: [purchaseOrderItem.id],
  }),
  lessonProgress: many(lessonProgress),
  certificates: many(certificate),
  reviews: many(courseReview),
}));

export const lessonProgressRelations = relations(lessonProgress, ({ one }) => ({
  enrollment: one(enrollment, {
    fields: [lessonProgress.enrollmentId],
    references: [enrollment.id],
  }),
  lesson: one(lesson, {
    fields: [lessonProgress.lessonId],
    references: [lesson.id],
  }),
}));

export const certificateRelations = relations(certificate, ({ one }) => ({
  enrollment: one(enrollment, {
    fields: [certificate.enrollmentId],
    references: [enrollment.id],
  }),
  user: one(user, {
    fields: [certificate.userId],
    references: [user.id],
  }),
  course: one(course, {
    fields: [certificate.courseId],
    references: [course.id],
  }),
  pdfAsset: one(mediaAsset, {
    fields: [certificate.pdfAssetId],
    references: [mediaAsset.id],
  }),
}));

export const wishlistItemRelations = relations(wishlistItem, ({ one }) => ({
  user: one(user, {
    fields: [wishlistItem.userId],
    references: [user.id],
  }),
  course: one(course, {
    fields: [wishlistItem.courseId],
    references: [course.id],
  }),
}));

export const courseReviewRelations = relations(courseReview, ({ one }) => ({
  enrollment: one(enrollment, {
    fields: [courseReview.enrollmentId],
    references: [enrollment.id],
  }),
  user: one(user, {
    fields: [courseReview.userId],
    references: [user.id],
  }),
  course: one(course, {
    fields: [courseReview.courseId],
    references: [course.id],
  }),
}));

export const lessonQuestionRelations = relations(lessonQuestion, ({ one, many }) => ({
  lesson: one(lesson, {
    fields: [lessonQuestion.lessonId],
    references: [lesson.id],
  }),
  user: one(user, {
    fields: [lessonQuestion.userId],
    references: [user.id],
  }),
  acceptedAnswer: one(lessonAnswer, {
    fields: [lessonQuestion.acceptedAnswerId],
    references: [lessonAnswer.id],
  }),
  answers: many(lessonAnswer),
}));

export const lessonAnswerRelations = relations(lessonAnswer, ({ one }) => ({
  question: one(lessonQuestion, {
    fields: [lessonAnswer.questionId],
    references: [lessonQuestion.id],
  }),
  user: one(user, {
    fields: [lessonAnswer.userId],
    references: [user.id],
  }),
}));
