import type GitSourceData from "@gramax/core/extensions/git/core/model/GitSourceData.schema";
import type GitSourceType from "@gramax/core/extensions/git/core/model/GitSourceType";
import { env } from "./utils";

export const getSourceDataFromEnv = (): GitSourceData => {
	return {
		sourceType: "GitLab" as GitSourceType,
		userEmail: env.optional("GX_E2E_GITLAB_EMAIL") || "e2e@gram.ax",
		userName: env.optional("GX_E2E_GITLAB_USERNAME") || "e2e",
		token: env("GX_E2E_GITLAB_TOKEN"),
		domain: env("GX_E2E_GITLAB_DOMAIN"),
		gitServerUsername: env.optional("GX_E2E_USER") || "git",
	};
};

export const getTestRepoInfoFromEnv = () => {
	return {
		testRepo: env("GX_E2E_GITLAB_TEST_REPO"),
		testRepoNoIndex: env("GX_E2E_GITLAB_TEST_REPO_NO_INDEX"),
		domain: env("GX_E2E_GITLAB_URL_NEW"),
		group: env("GX_E2E_GITLAB_GROUP"),
	} as const;
};
