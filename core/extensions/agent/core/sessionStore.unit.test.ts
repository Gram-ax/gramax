import type { AgentFileStore } from "./agentFileStore";
import type { AgentSession } from "./session";
import { AgentSessionStore } from "./sessionStore";

var mockedMaxStoredSessions: number | null;

jest.mock("./agentConfig", () => ({
	agentConfig: {
		get maxStoredSessions() {
			return mockedMaxStoredSessions;
		},
	},
}));

const fileStore = {
	listDir: jest.fn<Promise<string[]>, [string]>(),
	readJsonFile: jest.fn<Promise<unknown>, [string, unknown]>(),
	writeJsonFile: jest.fn<Promise<void>, [string, unknown]>(),
	deletePath: jest.fn<Promise<void>, [string]>(),
} as unknown as AgentFileStore;

const makeSession = (id: string, ts: number): ReturnType<AgentSession["toSnapshot"]> => ({
	id,
	title: id,
	openCatalogName: null,
	openItemPath: null,
	cancelled: false,
	processing: false,
	lastError: null,
	events: [{ type: "user_message", turnId: `turn-${id}`, ts, content: id }],
	usage: {
		totalUsage: 0,
		lastTurnUsage: 0,
		cacheHitTokens: 0,
		cacheMissTokens: 0,
		contextTokensUsed: 0,
		contextWindowTokens: 0,
		contextUsagePercent: 0,
	},
});

describe("applySessionsLimit via load", () => {
	let sessions: AgentSessionStore;

	beforeEach(async () => {
		jest.clearAllMocks();
		mockedMaxStoredSessions = 50;
		fileStore.listDir = jest.fn().mockResolvedValue([]);
		sessions = new AgentSessionStore(fileStore);
		await sessions.load();
	});

	test("keeps latest sessions by last activity", async () => {
		mockedMaxStoredSessions = 1;
		fileStore.listDir = jest.fn().mockResolvedValue(["old", "new"]);
		fileStore.readJsonFile = jest.fn().mockImplementation(async (path: string) => {
			if (path.includes("old")) return makeSession("old", 1);
			return makeSession("new", 10);
		});

		await sessions.load();
		const loaded = await sessions.list();

		expect(loaded.map((s) => s.id)).toEqual(["new"]);
		expect(fileStore.deletePath).toHaveBeenCalledWith("sessions/old");
	});

	test("keeps all sessions when limit is null", async () => {
		mockedMaxStoredSessions = null;
		fileStore.listDir = jest.fn().mockResolvedValue(["old", "new"]);
		fileStore.readJsonFile = jest.fn().mockImplementation(async (path: string) => {
			if (path.includes("old")) return makeSession("old", 1);
			return makeSession("new", 10);
		});

		await sessions.load();
		const loaded = await sessions.list();

		expect(loaded.map((s) => s.id).sort()).toEqual(["new", "old"]);
		expect(fileStore.deletePath).not.toHaveBeenCalled();
	});

	test("keeps active session even when older than limit", async () => {
		mockedMaxStoredSessions = 1;
		fileStore.listDir = jest.fn().mockResolvedValue(["old", "new"]);
		fileStore.readJsonFile = jest.fn().mockImplementation(async (path: string) => {
			if (path.includes("old")) return makeSession("old", 1);
			return makeSession("new", 10);
		});

		await sessions.load("old");
		const loaded = await sessions.list();

		expect(loaded.map((s) => s.id).sort()).toEqual(["new", "old"]);
		expect(fileStore.deletePath).not.toHaveBeenCalledWith("sessions/old");
	});
});
