import { projectWithOwner } from "./services/projectService";
import { profile } from "./services/userService";
async function main() { console.log(await profile("1"), await projectWithOwner("p1", "1")); }
main();
