import { desc } from 'drizzle-orm'
import {
  bigint,
  boolean,
  index,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
} from 'drizzle-orm/pg-core'

export const listingPlans = pgTable('listing_plans', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  description: text('description').notNull(),
  price: bigint('price', { mode: 'number' }).notNull(),
  durationDays: integer('durationDays').notNull(),
  maxPhotos: integer('maxPhotos').notNull(),
  premium: boolean('premium').notNull().default(false),
  featured: boolean('featured').notNull().default(false),
  isActive: boolean('isActive').notNull().default(true),
  displayOrder: integer('displayOrder').notNull().default(0),
  createdAt: timestamp('createdAt', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updatedAt', { withTimezone: true }).notNull().defaultNow(),
})

export const paymentSettings = pgTable('payment_settings', {
  id: integer('id').primaryKey(),
  bankName: text('bankName').notNull().default(''),
  cardNumber: text('cardNumber').notNull().default(''),
  cardHolder: text('cardHolder').notNull().default(''),
  telegramUsername: text('telegramUsername').notNull().default(''),
  instructions: text('instructions').notNull().default(''),
  updatedBy: text('updatedBy'),
  updatedAt: timestamp('updatedAt', { withTimezone: true }).notNull().defaultNow(),
})

export const paymentSubmissions = pgTable('payment_submissions', {
  id: text('id').primaryKey(),
  userId: text('userId').notNull(),
  propertyId: integer('propertyId').notNull(),
  planId: text('planId').notNull(),
  amount: bigint('amount', { mode: 'number' }).notNull(),
  payerName: text('payerName').notNull(),
  payerPhone: text('payerPhone').notNull(),
  reference: text('reference'),
  receiptPath: text('receiptPath').notNull(),
  status: text('status').notNull().default('pending'),
  reviewedBy: text('reviewedBy'),
  reviewNote: text('reviewNote'),
  createdAt: timestamp('createdAt', { withTimezone: true }).notNull().defaultNow(),
  reviewedAt: timestamp('reviewedAt', { withTimezone: true }),
}, (table) => [
  index('payment_submissions_status_created_idx').on(table.status, desc(table.createdAt)),
  index('payment_submissions_user_created_idx').on(table.userId, desc(table.createdAt)),
])

export const walletTransactions = pgTable('wallet_transactions', {
  id: text('id').primaryKey(),
  userId: text('userId').notNull(),
  actorUserId: text('actorUserId').notNull(),
  amountDelta: bigint('amountDelta', { mode: 'number' }).notNull(),
  balanceAfter: bigint('balanceAfter', { mode: 'number' }).notNull(),
  note: text('note').notNull(),
  createdAt: timestamp('createdAt', { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  index('wallet_transactions_user_created_idx').on(table.userId, desc(table.createdAt)),
  index('wallet_transactions_created_idx').on(desc(table.createdAt)),
])

export const auditLogs = pgTable('audit_logs', {
  id: text('id').primaryKey(),
  actorUserId: text('actorUserId'),
  action: text('action').notNull(),
  subjectType: text('subjectType').notNull(),
  subjectId: text('subjectId'),
  metadata: jsonb('metadata').$type<Record<string, unknown>>().notNull().default({}),
  createdAt: timestamp('createdAt', { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  index('audit_logs_actor_created_idx').on(table.actorUserId, desc(table.createdAt)),
  index('audit_logs_action_created_idx').on(table.action, desc(table.createdAt)),
])
