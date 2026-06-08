import { expect } from "@playwright/test";
import { getTestRepoInfoFromEnv } from "@utils/source";
import { homeTest as test } from "@web/fixtures/home.fixture";

const repo = getTestRepoInfoFromEnv();

const clonePath = `/${repo.domain}/${repo.group}/${repo.testRepo}`;

test.use({ startUrl: clonePath });

test("modal-to-open-desktop", async ({ sharedPage }) => {
	const link = await sharedPage.getByTestId("open-in-app-link");
	await expect(link).toHaveAttribute("href", `gramax://${clonePath}`);
});
