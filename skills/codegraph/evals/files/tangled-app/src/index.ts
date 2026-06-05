import { withOwner } from "./services/projectService";
import { profile } from "./services/userService";
async function main(){ console.log(await profile("1"), await withOwner("p","1")); }
main();
