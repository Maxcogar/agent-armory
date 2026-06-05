import { getUser, listUsers } from "../api/users";
export async function profile(id: string) { return { user: await getUser(id) }; }
export { listUsers };
