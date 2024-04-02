import { LaunchOptions } from "playwright";

const ci = (b: boolean) => (process.env.CI ? false : b);
const addr = (b: string) => process.env.URL ?? b;

export default {
	timeouts: {
		short: 3000,
		medium: 15000,
		long: 20000,
	},
	workers: !ci(true) ? 1 : undefined,
	highlight: ci(true),
	screenshots: true,
	url: addr("http://localhost:5173"),
	launch: {
		devtools: false,
		args: ["--disable-web-security", "--headless=new", "--disable-features=IsolateOrigins,site-per-process"],
	} as LaunchOptions,
};
