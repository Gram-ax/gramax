import { expect } from "@playwright/test";
import { baseTest } from "@static/fixtures/base.fixture";

baseTest("hi!", ({ sharedPage }) => {
	expect(sharedPage.url()).toBe("http://localhost:6002/");
});
