const path = require("path");
const { testGitCatalogUtils } = require("../core/extensions/git/test/testGitCatalogUtils");
const FIXTURES_PATH = path.join(process.cwd(), "core/extensions/git/test/fixtures");
const { execSync } = require("child_process");

testGitCatalogUtils.removeGit();
try {
	execSync("npx git-http-mock-server stop", { cwd: FIXTURES_PATH });
} catch (error) {
	console.error("Failed to stop git-http-mock-server:", error);
}
