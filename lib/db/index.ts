import { Pool } from 'pg'
import { drizzle } from 'drizzle-orm/node-postgres'
import * as schema from './schema'

declare global {
  var makoniPool: Pool | undefined
}

const connectionString = process.env.DATABASE_URL

if (!connectionString) {
  throw new Error('DATABASE_URL is not configured')
}

export const pool =
  globalThis.makoniPool ??
  new Pool({
    connectionString,
    max: 5,
    idleTimeoutMillis: 30_000,
    connectionTimeoutMillis: 10_000,
  })

if (process.env.NODE_ENV !== 'production') {
  globalThis.makoniPool = pool
}

export const db = drizzle(pool, { schema })
