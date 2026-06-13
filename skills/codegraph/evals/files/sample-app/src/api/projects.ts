import { pool } from "../db/pool";
import { tables } from "../db/schema";
export async function getProject(id: string) {
  return (await pool.query<{ id: string }>(`SELECT * FROM ${tables[1]}`))[0];
}
