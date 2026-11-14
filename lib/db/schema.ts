import { desc } from 'drizzle-orm'
import {
  boolean,
  index,
  integer,
  pgTable,
  text,
  timestamp,
  unique,
  bigint,
} from 'drizzle-orm/pg-core'

export const user = pgTable('user', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  emailVerified: boolean('emailVerified').notNull().default(false),
  image: text('image'),
  createdAt: timestamp('createdAt').notNull().defaultNow(),
  updatedAt: timestamp('updatedAt').notNull().defaultNow(),
})

export const session = pgTable('session', {
  id: text('id').primaryKey(),
  expiresAt: timestamp('expiresAt').notNull(),
  token: text('token').notNull().unique(),
  createdAt: timestamp('createdAt').notNull().defaultNow(),
  updatedAt: timestamp('updatedAt').notNull().defaultNow(),
  ipAddress: text('ipAddress'),
  userAgent: text('userAgent'),
  userId: text('userId')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
})

export const account = pgTable('account', {
  id: text('id').primaryKey(),
  accountId: text('accountId').notNull(),
  providerId: text('providerId').notNull(),
  userId: text('userId')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
  accessToken: text('accessToken'),
  refreshToken: text('refreshToken'),
  idToken: text('idToken'),
  accessTokenExpiresAt: timestamp('accessTokenExpiresAt'),
  refreshTokenExpiresAt: timestamp('refreshTokenExpiresAt'),
  scope: text('scope'),
  password: text('password'),
  createdAt: timestamp('createdAt').notNull().defaultNow(),
  updatedAt: timestamp('updatedAt').notNull().defaultNow(),
})

export const verification = pgTable('verification', {
  id: text('id').primaryKey(),
  identifier: text('identifier').notNull(),
  value: text('value').notNull(),
  expiresAt: timestamp('expiresAt').notNull(),
  createdAt: timestamp('createdAt').defaultNow(),
  updatedAt: timestamp('updatedAt').defaultNow(),
})

export const properties = pgTable(
  'properties',
  {
    id: integer('id').primaryKey().generatedAlwaysAsIdentity(),
    userId: text('userId').notNull(),
    deal: text('deal').notNull(),
    propertyType: text('propertyType').notNull(),
    price: bigint('price', { mode: 'number' }).notNull(),
    rooms: integer('rooms').notNull().default(0),
    baths: integer('baths').notNull().default(0),
    areaM2: integer('areaM2').notNull(),
    region: text('region').notNull(),
    district: text('district').notNull(),
    title: text('title').notNull(),
    agent: text('agent').notNull(),
    premium: boolean('premium').notNull().default(false),
    recommend: boolean('recommend').notNull().default(false),
    imageUrl: text('imageUrl').notNull(),
    isPublished: boolean('isPublished').notNull().default(true),
    createdAt: timestamp('createdAt').notNull().defaultNow(),
  },
  (table) => [
    index('properties_published_created_at_idx').on(
      table.isPublished,
      desc(table.createdAt),
    ),
    index('properties_user_created_at_idx').on(
      table.userId,
      desc(table.createdAt),
    ),
  ],
)
