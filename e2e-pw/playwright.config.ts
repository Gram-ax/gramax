import { defineConfig, devices } from "@playwright/test";

const isCI = !!process.env.PLAYWRIGHT_CI;
const isDev = !!process.env.PLAYWRIGHT_DEV;

export default defineConfig({
	captureGitInfo: {
		commit: true,
		diff: true,
	},

	expect: {
		timeout: 7000,
	},

	failOnFlakyTests: isCI,

	outputDir: "./report",

	// Run all tests in parallel.
	fullyParallel: true,

	// Fail the build on CI if you accidentally left test.only in the source code.
	forbidOnly: isCI,

	// Repeat each test
	repeatEach: 1,

	// Retry on CI only.
	retries: isCI ? 2 : 0,

	timeout: isCI ? 50_000 : 30_000,

	// Opt out of parallel tests on dev server.
	workers: isDev ? 1 : process.env.PLAYWRIGHT_WORKERS || 3,

	// Reporter to use
	reporter: "list",

	use: {
		trace: "retain-on-first-failure",
		actionTimeout: isCI ? 7000 : 1200,
		navigationTimeout: isCI ? 7000 : 30_000,
	},

	// Configure projects for major browsers.
	projects: [
		{
			name: "web",
			testDir: "platforms/web/tests",
			use: {
				...devices["Desktop Chrome"],
				bypassCSP: true,
				baseURL: isDev ? "https://localhost:6001" : "http://localhost:6001",
				screenshot: "on-first-failure",
				ignoreHTTPSErrors: true,
				launchOptions: {
					args: [
						"--disable-web-security",
						"--disable-features=IsolateOrigins,site-per-process,CertVerifierBuiltinFeatureUsage",
						"--ignore-certificate-errors",
						"--ignore-certificate-errors-spki-list",
						"--allow-insecure-localhost",
					],
				},
			},
		},
		{
			name: "static",
			testDir: "./platforms/static/tests",
			use: {
				...devices["Desktop Chrome"],
				bypassCSP: true,
				baseURL: "http://localhost:6002",
				screenshot: "on-first-failure",
			},
		},
		{
			name: "docportal-prepare",
			testDir: "./platforms/docportal/prepare",
			use: {
				...devices["Desktop Chrome"],
				baseURL: "http://localhost:6003",
				bypassCSP: true,
				screenshot: "on-first-failure",
			},
		},
		{
			name: "docportal",
			testDir: "./platforms/docportal/tests",
			dependencies: ["docportal-prepare"],
			use: {
				...devices["Desktop Chrome"],
				baseURL: "http://localhost:6003",
				bypassCSP: true,
				screenshot: "on-first-failure",
			},
		},
		{
			name: "docportal-enterprise",
			testDir: "./platforms/docportal/tests/enterprise",
			use: {
				...devices["Desktop Chrome"],
				baseURL: "http://localhost:6003",
				bypassCSP: true,
				screenshot: "on-first-failure",
			},
		},
	],

	webServer: isDev
		? {
				command: "PORT=6001 bun run --cwd ../apps/browser dev",
				port: 6001,
				reuseExistingServer: true,
				ignoreHTTPSErrors: true,
			}
		: undefined,
});
