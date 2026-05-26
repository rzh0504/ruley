import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl && process.env.NODE_ENV !== "test") {
  console.warn("[DB] DATABASE_URL is not configured.");
}

const sql = postgres(databaseUrl || "postgres://postgres:postgres@localhost:5432/ruley", {
  max: 1,
  prepare: false,
});

export const db = drizzle(sql, { schema });
export { schema };
