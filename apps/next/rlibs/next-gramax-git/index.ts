import { createRequire } from "module";
import { pathToFileURL } from "node:url";
const importNodeModule = createRequire(pathToFileURL(__filename).toString());
const git = importNodeModule("gramax-git.node");

export default git;
