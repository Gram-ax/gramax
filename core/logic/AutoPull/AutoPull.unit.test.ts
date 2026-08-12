import type Application from "@app/types/Application";
import type Logger from "@ext/loggers/Logger";
import SourceType from "@ext/storage/logic/SourceDataProvider/model/SourceType";
import type WorkspaceManager from "@ext/workspace/WorkspaceManager";
import { AutoPull, getAutoPullSourceData, getWebhookSourceData, resolveAutoPullIntervalMs } from "./AutoPull";

describe("resolveAutoPullIntervalMs", () => {
	it("disables the timer for a negative interval", () => {
		expect(resolveAutoPullIntervalMs("-1")).toBeNull();
		expect(resolveAutoPullIntervalMs("-0.5")).toBeNull();
	});

	it("uses the configured interval in ms", () => {
		expect(resolveAutoPullIntervalMs("60")).toBe(60_000);
	});

	it("falls back to the default for unset, zero, or non-numeric values", () => {
		expect(resolveAutoPullIntervalMs(undefined)).toBe(180_000);
		expect(resolveAutoPullIntervalMs("0")).toBe(180_000);
		expect(resolveAutoPullIntervalMs("abc")).toBe(180_000);
	});

	it("caps the interval at the setTimeout limit so it never wraps to an immediate hot loop", () => {
		expect(resolveAutoPullIntervalMs("86400")).toBe(86_400_000);
		expect(resolveAutoPullIntervalMs(String(Number.MAX_SAFE_INTEGER))).toBe(2 ** 31 - 1);
	});
});

describe("AutoPull cycle scheduling", () => {
	const originalToken = process.env.AUTO_PULL_TOKEN;
	const originalInterval = process.env.AUTO_PULL_INTERVAL;
	const originalDelay = process.env.AUTO_PULL_DELAY;

	const logger = {
		logInfo: jest.fn(),
		logWarning: jest.fn(),
		logError: jest.fn(),
		logTrace: jest.fn(),
		ln: jest.fn(),
		setLogLevel: jest.fn(),
	} as unknown as Logger;

	beforeEach(() => {
		jest.useFakeTimers();
		process.env.AUTO_PULL_TOKEN = "token";
		process.env.AUTO_PULL_INTERVAL = "60";
		process.env.AUTO_PULL_DELAY = "1";
	});

	afterEach(() => {
		jest.useRealTimers();
		process.env.AUTO_PULL_TOKEN = originalToken;
		process.env.AUTO_PULL_INTERVAL = originalInterval;
		process.env.AUTO_PULL_DELAY = originalDelay;
	});

	// `wm.current()` throws NoActiveWorkspace when no workspace is selected. A throw used to skip the
	// re-arm at the tail of the pull loop and kill auto-pull until the process restarted.
	it("keeps scheduling cycles after a failing one", async () => {
		const current = jest
			.fn()
			.mockImplementationOnce(() => {
				throw new Error("no active workspace");
			})
			.mockImplementation(() => ({ getAllCatalogs: () => new Map() }));
		const app = Promise.resolve({ logger, wm: { current } as unknown as WorkspaceManager } as Application);

		await new AutoPull().start(app);
		await jest.advanceTimersByTimeAsync(0);
		expect(current).toHaveBeenCalledTimes(1);

		await jest.advanceTimersByTimeAsync(60_000);
		expect(current).toHaveBeenCalledTimes(2);

		await jest.advanceTimersByTimeAsync(60_000);
		expect(current).toHaveBeenCalledTimes(3);
	});
});

describe("getAutoPullSourceData", () => {
	const originalToken = process.env.AUTO_PULL_TOKEN;
	const originalUsername = process.env.AUTO_PULL_USERNAME;

	afterEach(() => {
		process.env.AUTO_PULL_TOKEN = originalToken;
		process.env.AUTO_PULL_USERNAME = originalUsername;
	});

	it("returns null without token", () => {
		delete process.env.AUTO_PULL_TOKEN;

		expect(getAutoPullSourceData("git.example.com", SourceType.git)).toBeNull();
	});

	it("builds source data from auto-pull env", () => {
		process.env.AUTO_PULL_TOKEN = "token";
		process.env.AUTO_PULL_USERNAME = "bot";

		const sourceData = getAutoPullSourceData("git.example.com", SourceType.git);

		expect(sourceData?.sourceType).toBe(SourceType.git);
		expect(sourceData?.domain).toBe("git.example.com");
		expect(sourceData?.userName).toBe("autopull");
		expect(sourceData?.gitServerUsername).toBe("bot");
		expect(sourceData?.userEmail).toBe("autopull");
		expect(sourceData?.token).toBe("token");
	});
});

describe("getWebhookSourceData", () => {
	const originalAutoPullToken = process.env.AUTO_PULL_TOKEN;
	const originalWebhookToken = process.env.WEBHOOK_TOKEN;

	afterEach(() => {
		process.env.AUTO_PULL_TOKEN = originalAutoPullToken;
		process.env.WEBHOOK_TOKEN = originalWebhookToken;
	});

	it("returns null when neither WEBHOOK_TOKEN nor AUTO_PULL_TOKEN is set", () => {
		delete process.env.WEBHOOK_TOKEN;
		delete process.env.AUTO_PULL_TOKEN;

		expect(getWebhookSourceData("git.example.com", SourceType.git)).toBeNull();
	});

	it("prefers WEBHOOK_TOKEN over AUTO_PULL_TOKEN", () => {
		process.env.AUTO_PULL_TOKEN = "auto-pull-token";
		process.env.WEBHOOK_TOKEN = "webhook-token";

		const sourceData = getWebhookSourceData("git.example.com", SourceType.git);

		expect(sourceData?.token).toBe("webhook-token");
		expect(sourceData?.sourceType).toBe(SourceType.git);
	});

	it("falls back to AUTO_PULL_TOKEN when WEBHOOK_TOKEN is unset", () => {
		delete process.env.WEBHOOK_TOKEN;
		process.env.AUTO_PULL_TOKEN = "auto-pull-token";

		const sourceData = getWebhookSourceData("git.example.com", SourceType.git);

		expect(sourceData?.token).toBe("auto-pull-token");
		expect(sourceData?.sourceType).toBe(SourceType.git);
	});
});
