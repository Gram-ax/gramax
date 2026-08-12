/** @jest-environment node */
import { createEventEmitter } from "@core/Event/EventEmitter";
import type { Workspace, WorkspaceEvents } from "@ext/workspace/Workspace";
import WebhookPeerNotifier from "./WebhookPeerNotifier";

const SECRET = "test-secret";
const tick = (ms: number) => new Promise((r) => setTimeout(r, ms));

const makeWorkspace = () => {
	const events = createEventEmitter<WorkspaceEvents>();
	return { workspace: { events } as unknown as Workspace, events };
};

describe("WebhookPeerNotifier", () => {
	const OLD_ENV = process.env;
	let fetchMock: jest.Mock;

	beforeEach(() => {
		process.env = { ...OLD_ENV, WEBHOOK_SECRET: SECRET, WEBHOOK_PEERS: "http://peer-a" };
		fetchMock = jest.fn(async () => new Response(null, { status: 200 }));
		global.fetch = fetchMock as unknown as typeof fetch;
	});

	afterEach(() => {
		process.env = OLD_ENV;
	});

	it("collapses a burst of events for one catalog into a single peer refresh", async () => {
		const { workspace, events } = makeWorkspace();
		new WebhookPeerNotifier(workspace, 5).mount();

		const catalog = { name: "docs" } as never;
		await events.emit("checkout", { catalog } as never);
		await events.emit("sync", { catalog } as never);
		await events.emit("reset", { catalog } as never);

		await tick(30);
		expect(fetchMock).toHaveBeenCalledTimes(1);
		expect(fetchMock.mock.calls[0][0]).toBe("http://peer-a/api/webhook/refresh/docs");
	});

	it("notifies on remove-catalog", async () => {
		const { workspace, events } = makeWorkspace();
		new WebhookPeerNotifier(workspace, 5).mount();

		await events.emit("remove-catalog", { name: "docs" });

		await tick(30);
		expect(fetchMock).toHaveBeenCalledTimes(1);
	});

	it("does nothing when WEBHOOK_PEERS is unset", async () => {
		delete process.env.WEBHOOK_PEERS;
		const { workspace, events } = makeWorkspace();
		new WebhookPeerNotifier(workspace, 5).mount();

		await events.emit("add-catalog", { catalog: { name: "docs" } } as never);

		await tick(30);
		expect(fetchMock).not.toHaveBeenCalled();
	});
});
