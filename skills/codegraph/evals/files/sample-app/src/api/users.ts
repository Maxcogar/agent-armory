import { pool } from "../db/pool";
import { tables } from "../db/schema";
export async function getUser(id: string) {
  return (await pool.query<{ id: string }>(`SELECT * FROM ${tables[0]} WHERE id='${id}'`))[0];
}
export async function listUsers() { return pool.query("SELECT * FROM users"); }
