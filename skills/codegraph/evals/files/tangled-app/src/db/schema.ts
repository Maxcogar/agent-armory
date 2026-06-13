import { pool } from "@db/pool";
export const tables = ["users","projects"];
export async function migrate(){ await pool.query("..."); }
