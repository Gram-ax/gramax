import { Given, When } from "@cucumber/cucumber";
import E2EWorld from "e2e/models/World";

type Role = "reader" | "reviewer" | "editor" | "catalogOwner" | "workspaceOwner";

async function logoutIfNeeded(world: E2EWorld) {
	const page = world.page().inner();

	await world.page().waitForLoad();

	const avatarButton = page.locator(world.replace("кнопка аватара") || "");

	const isLoggedIn = await avatarButton
		.waitFor({ state: "visible", timeout: 1000 })
		.then(() => true)
		.catch(() => false);

	if (isLoggedIn) {
		await avatarButton.click();

		const dropdown = page.locator(world.replace("дропдаун аватара") || "");
		await dropdown.waitFor({ state: "visible", timeout: 5000 });

		const logoutButton = page.locator(world.replace("кнопка выйти") || "");
		await logoutButton.click();

		const finalLogoutButton = page.locator(world.replace("кнопка выход") || "");
		await finalLogoutButton.waitFor({ state: "visible", timeout: 500 });

		await finalLogoutButton.click();

		await world.page().waitForLoad();
	}
}

async function loginViaKeycloak(world: E2EWorld, role: Role) {
	const page = world.page().inner();

	await logoutIfNeeded(world);

	const loginButton = page.locator(world.replace("кнопка входа") || "");
	const isLoginButtonVisible = await loginButton.isVisible().catch(() => false);

	if (isLoginButtonVisible) {
		await loginButton.click();

		await page.waitForTimeout(500);
	}

	const ssoButton = page.locator(world.replace("кнопка SSO") || "");
	const isSsoButtonVisible = await ssoButton.isVisible().catch(() => false);

	if (isSsoButtonVisible) {
		await ssoButton.click();
		await world.page().waitForLoad();
	}

	await loginKeycloak(world, role, false); // false = не нужен повторный выход
}

async function loginKeycloak(world: E2EWorld, role: Role, autoLogout = true) {
	const page = world.page().inner();

	await world.page().waitForLoad();

	if (autoLogout) {
		await logoutIfNeeded(world);
	}

	const backButton = page.locator("#reset-login");
	const isBackButtonVisible = await backButton.isVisible().catch(() => false);

	if (isBackButtonVisible) {
		await backButton.click();
		await world.page().waitForLoad();
	}

	const usernameInput = page.locator('input[name="username"], input[id="username"]');
	await usernameInput.waitFor({ state: "visible", timeout: 10000 });

	const email = world.replace(`%keycloak-${role}-mail%`) ?? "";
	const password = world.replace(`%keycloak-${role}-password%`) ?? "";

	await usernameInput.fill(email);

	const passwordInput = page.locator('input[name="password"], input[id="password"], input[type="password"]');
	await passwordInput.waitFor({ state: "visible" });

	await passwordInput.fill(password);

	const signInButton = page.locator('input[type="submit"], button[type="submit"]').first();
	await signInButton.click();

	await world.page().waitForLoad();
}

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

Given("выходим из системы если залогинены", async function (this: E2EWorld) {
	await logoutIfNeeded(this);
});

When("выходим из системы", async function (this: E2EWorld) {
	await logoutIfNeeded(this);
});

When("нажимаем на кнопку аватара", async function (this: E2EWorld) {
	const page = this.page().inner();
	const avatarButton = page.locator(this.replace("кнопка аватара") || "");
	await avatarButton.click();

	const dropdown = page.locator(this.replace("дропдаун аватара") || "");
	await dropdown.waitFor({ state: "visible", timeout: 5000 });
});

When("нажимаем кнопку выйти", async function (this: E2EWorld) {
	const page = this.page().inner();
	const logoutButton = page.locator(this.replace("кнопка выйти") || "");
	await logoutButton.click();
	await this.page().waitForLoad();
});

When("логинимся через Keycloak как {string}", async function (this: E2EWorld, role: Role) {
	await loginViaKeycloak(this, role);
});
