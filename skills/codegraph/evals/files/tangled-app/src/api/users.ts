import { pool } from "@db/pool";
import { tables } from "@db/schema";
export async function getUser(id){ return (await pool.query(`SELECT ${tables[0]}`))[0]; }
export async function listUsers(){ return pool.query("users"); }
