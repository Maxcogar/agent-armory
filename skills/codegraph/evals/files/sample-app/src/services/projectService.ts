import { getProject } from "../api/projects";
import { profile } from "./userService";
export async function projectWithOwner(pid: string, uid: string) {
  return { project: await getProject(pid), owner: await profile(uid) };
}
