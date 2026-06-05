import { getUser, fmtDate } from "@api";
export async function profile(id){ const u = await getUser(id); return { u, at: fmtDate(Date.now()) }; }
