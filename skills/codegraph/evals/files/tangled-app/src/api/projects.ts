import { pool } from "@db/pool";
export async function getProject(id){ return (await pool.query("projects"))[0]; }
