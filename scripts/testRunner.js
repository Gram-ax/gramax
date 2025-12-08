const path = require("path");
const { spawn, execSync } = require("child_process");
const { testGitCatalogUtils } = require("../core/extensions/git/test/testGitCatalogUtils");

const arg = process.argv[2]; // unit, int, fileName or undefined
const FIXTURES_PATH = path.join(process.cwd(), "core/extensions/git/test/fixtures");
process.env.ROOT_PATH = path.join(process.cwd(), "app/test/docs");
process.env.PRODUCTION = "false";

const useServer = !(process.argv.includes("--no-server") || process.argv.includes("-n"));
if (!useServer) process.argv = process.argv.filter((argv) => argv !== "--no-server" && argv !== "-n");

if (useServer) {
	execSync("npx git-http-mock-server start", { cwd: FIXTURES_PATH });
	testGitCatalogUtils.initGit();
}

let jestArgs = ["--reporters=default", "--reporters=jest-junit", "--ci", "--runInBand", "--forceExit", "-u"];

switch (arg) {
	case "unit":
		jestArgs = [...jestArgs, "--testMatch", "**/*.unit.test.ts"];
		break;
	case "int":
		jestArgs = [...jestArgs, "--testMatch", "**/*.int.test.ts"];
		break;
	case "ges":
		jestArgs = [...jestArgs, "--testMatch", "**/*.ges.test.ts"];
		break;
	case undefined:
		break;
	default:
		// If arg is not unit, int or undefined, then consider it a filename
		jestArgs = [...jestArgs, arg];
		break;
}

process.env.NODE_ENV = "test";

const test = spawn("jest", [...jestArgs, ...process.argv.slice(3)], { stdio: "inherit", shell: true });

if (useServer) {
	test.on("exit", (code) => {
		testGitCatalogUtils.removeGit();
		try {
			execSync("npx git-http-mock-server stop", { cwd: FIXTURES_PATH });
		} catch (error) {
			console.error("Failed to stop git-http-mock-server:", error);
		}
		process.exit(code);
	});
}
