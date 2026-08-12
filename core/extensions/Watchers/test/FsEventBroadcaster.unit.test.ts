/**
 * @jest-environment jsdom
 */
import { BroadcastChannel as NodeBroadcastChannel } from "worker_threads";

// jsdom doesn't expose BroadcastChannel; polyfill from worker_threads
if (typeof globalThis.BroadcastChannel === "undefined") {
	(globalThis as unknown as { BroadcastChannel: typeof BroadcastChannel }).BroadcastChannel =
		NodeBroadcastChannel as unknown as typeof BroadcastChannel;
}

import { BROADCAST_CHANNEL_NAME } from "@ext/Watchers/FsEvent";
import { broadcastFsEvent } from "@ext/Watchers/FsEventBroadcaster";

describe("FsEventBroadcaster", () => {
	let received: { events: { relPath: string; kind: { type: string; from?: string } }[] }[];
	let listener: BroadcastChannel;

	beforeEach(() => {
		received = [];
		listener = new BroadcastChannel(BROADCAST_CHANNEL_NAME);
		listener.onmessage = (ev) => received.push(ev.data);
	});

	afterEach(() => listener.close());

	test("batches multiple events in single microtask flush", async () => {
		broadcastFsEvent({ relPath: "a.md", kind: { type: "modified" } });
		broadcastFsEvent({ relPath: "b.md", kind: { type: "created" } });
		broadcastFsEvent({ relPath: "c.md", kind: { type: "removed" } });
		await new Promise<void>((r) => queueMicrotask(() => r()));
		await new Promise<void>((r) => setTimeout(r, 20));

		expect(received.length).toBe(1);
		expect(received[0].events.map((e) => e.relPath)).toEqual(["a.md", "b.md", "c.md"]);
	});

	test("no-op when BroadcastChannel undefined", () => {
		const original = (globalThis as unknown as { BroadcastChannel?: typeof BroadcastChannel }).BroadcastChannel;
		(globalThis as unknown as { BroadcastChannel?: typeof BroadcastChannel }).BroadcastChannel = undefined;
		try {
			expect(() => broadcastFsEvent({ relPath: "x", kind: { type: "modified" } })).not.toThrow();
		} finally {
			(globalThis as unknown as { BroadcastChannel?: typeof BroadcastChannel }).BroadcastChannel = original;
		}
	});
});
