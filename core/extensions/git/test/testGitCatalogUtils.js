const fs = require("fs");
const join = require("path").join;
const { TEST_GIT_CATALOG_PATH } = require("./testGitCatalogPath");

const testGitCatalogUtils = {
	initGit: () => {
		fs.cpSync(join(TEST_GIT_CATALOG_PATH, ".git2"), join(TEST_GIT_CATALOG_PATH, ".git"), {
			recursive: true,
		});
		fs.cpSync(
			join(TEST_GIT_CATALOG_PATH, "submoduleDocs", ".git2"),
			join(TEST_GIT_CATALOG_PATH, "submoduleDocs", ".git"),
			{
				recursive: true,
			},
		);
		fs.cpSync(join(TEST_GIT_CATALOG_PATH, ".gitignore2"), join(TEST_GIT_CATALOG_PATH, ".gitignore"), {
			recursive: true,
		});
		fs.cpSync(
			join(TEST_GIT_CATALOG_PATH, "submoduleDocs", ".gitignore2"),
			join(TEST_GIT_CATALOG_PATH, "submoduleDocs", ".gitignore"),
			{ recursive: true },
		);
	},
	removeGit: () => {
		fs.rmSync(join(TEST_GIT_CATALOG_PATH, ".git"), { recursive: true, force: true, maxRetries: 5 });
		fs.rmSync(join(TEST_GIT_CATALOG_PATH, "submoduleDocs", ".git"), {
			recursive: true,
			force: true,
			maxRetries: 5,
		});
		fs.unlinkSync(join(TEST_GIT_CATALOG_PATH, ".gitignore"));
		fs.unlinkSync(join(TEST_GIT_CATALOG_PATH, "submoduleDocs", ".gitignore"));
	},
};

module.exports = { testGitCatalogUtils };
