import { getProject } from "@api";
import { profile } from "./userService";
export async function withOwner(p,u){ return { p: await getProject(p), owner: await profile(u) }; }
