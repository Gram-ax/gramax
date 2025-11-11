import { When } from "@cucumber/cucumber";
import E2EWorld from "e2e/models/World";

When("авторизовываемся в Azure", async function (this: E2EWorld) {
	const page = this.page().inner();

	await this.page().waitForLoad();
	const emailInput = page.locator('input[type="email"]');
	await emailInput.waitFor({ state: "visible" });
	await emailInput.fill(this.replace("%azure-mail%") ?? "");

	await page.locator('input[type="submit"][value="Next"], input[type="submit"][value="Далее"]').click();

	await this.page().waitForLoad();

	const passwordInput = page.locator('input[type="password"]');
	await passwordInput.waitFor({ state: "visible" });
	await passwordInput.fill(this.replace("%azure-password%") ?? "");

	await this.page().waitForLoad();

	await page.locator('input[type="submit"][value="Sign in"], input[type="submit"][value="Войти"]').click();

	try {
		const staySignedInButton = page.locator('input[type="submit"][value="Yes"], input[type="submit"][value="Да"]');
		await staySignedInButton.waitFor({ state: "visible", timeout: 5000 });
		await staySignedInButton.click();
		await this.page().waitForLoad();
	} catch (e) {
		console.log(e);
	}

	await this.page().waitForLoad();
});
