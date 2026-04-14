import { chromium } from "playwright";

const url = process.argv[2] || "https://localhost:6001";

const browser = await chromium.launch({
	headless: false,
	args: [
		"--disable-web-security",
		"--disable-features=IsolateOrigins,site-per-process,CertVerifierBuiltinFeatureUsage",
		"--ignore-certificate-errors",
		"--ignore-certificate-errors-spki-list",
		"--allow-insecure-localhost",
		"--disable-dev-shm-usage",
		"--no-sandbox",
		"--disable-setuid-sandbox",
	],
});

const context = await browser.newContext({ ignoreHTTPSErrors: true, bypassCSP: true });

const page = await context.newPage();
await page.goto(url);

await page.pause();
