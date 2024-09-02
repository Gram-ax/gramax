const fs = require("fs-extra");
const join = require("path").join;
const { execSync } = require("child_process");
const { TEST_GIT_CATALOG_PATH } = require("./testGitCatalogPath");
const { TEST_GIT_FIXTURES_PATH } = require("./testGitFixturesPath");

const remoteRepLocal = join(TEST_GIT_FIXTURES_PATH, "remoteRep_local");
const remoteRepLocalWithoutSubmodules = join(TEST_GIT_FIXTURES_PATH, "remoteRep_local_no_submodules");

const testGitCatalogUtils = {
	initGit: () => {
		fs.cpSync(join(TEST_GIT_CATALOG_PATH, ".git2"), join(TEST_GIT_CATALOG_PATH, ".git"), {
			recursive: true,
		});
		fs.cpSync(join(TEST_GIT_CATALOG_PATH, ".gitignore2"), join(TEST_GIT_CATALOG_PATH, ".gitignore"), {
			recursive: true,
		});
		fs.cpSync(
			join(TEST_GIT_CATALOG_PATH, "submoduleDocs", ".gitignore2"),
			join(TEST_GIT_CATALOG_PATH, "submoduleDocs", ".gitignore"),
			{ recursive: true },
		);

		fs.cpSync(join(remoteRepLocal, ".git2"), join(remoteRepLocal, ".git"), { recursive: true });
		fs.renameSync(join(remoteRepLocal, "docs/submodule1/.git2"), join(remoteRepLocal, "docs/submodule1/.git"));
		fs.renameSync(join(remoteRepLocal, "docs/submodule2/.git2"), join(remoteRepLocal, "docs/submodule2/.git"));

		fs.cpSync(join(remoteRepLocalWithoutSubmodules, ".git2"), join(remoteRepLocalWithoutSubmodules, ".git"), {
			recursive: true,
		});
	},
	removeGit: () => {
		const gitDir = join(TEST_GIT_CATALOG_PATH, ".git");
		if (fs.existsSync(gitDir)) fs.rmSync(gitDir, { recursive: true, force: true, maxRetries: 5 });
		const gitIgnoreDir = join(TEST_GIT_CATALOG_PATH, ".gitignore");
		if (fs.existsSync(gitIgnoreDir)) fs.unlinkSync(gitIgnoreDir);

		if (fs.existsSync(join(remoteRepLocal, ".git"))) {
			fs.rmSync(join(remoteRepLocal, ".git"), {
				recursive: true,
				force: true,
				maxRetries: 5,
			});
		}
		if (fs.existsSync(join(remoteRepLocal, "docs/submodule1/.git")))
			fs.renameSync(join(remoteRepLocal, "docs/submodule1/.git"), join(remoteRepLocal, "docs/submodule1/.git2"));
		if (fs.existsSync(join(remoteRepLocal, "docs/submodule2/.git")))
			fs.renameSync(join(remoteRepLocal, "docs/submodule2/.git"), join(remoteRepLocal, "docs/submodule2/.git2"));
		if (fs.existsSync(join(remoteRepLocalWithoutSubmodules, ".git"))) {
			fs.rmSync(join(remoteRepLocalWithoutSubmodules, ".git"), {
				recursive: true,
				force: true,
			});
		}
	},
};

module.exports = { testGitCatalogUtils };
