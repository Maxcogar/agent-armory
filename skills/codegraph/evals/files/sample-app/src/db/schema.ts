import { pool } from "./pool";
export async function migrate() { await pool.query("CREATE TABLE users(...)"); }
export const tables = ["users", "projects"];
