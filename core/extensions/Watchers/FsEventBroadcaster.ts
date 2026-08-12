import { addEvent, Level } from "@ext/loggers/opentelemetry";
import { BROADCAST_CHANNEL_NAME, type FsEventDto } from "@ext/Watchers/FsEvent";

let channel: BroadcastChannel | undefined;
let pending: FsEventDto[] = [];
let flushScheduled = false;

export const broadcastFsEvent = (event: FsEventDto): void => {
	if (typeof BroadcastChannel === "undefined") return;
	if (!channel) {
		channel = new BroadcastChannel(BROADCAST_CHANNEL_NAME);
		// In Node (cli, ssr) BroadcastChannel ref's the event loop and keeps the process alive.
		// Webs don't expose unref, so guard the call.
		(channel as unknown as { unref?: () => void }).unref?.();
	}
	pending.push(event);
	addEvent("fs.broadcast.queue", Level.Internal, { kind: event.kind.type, relPath: event.relPath });
	if (flushScheduled) return;
	flushScheduled = true;
	queueMicrotask(() => {
		const events = pending;
		pending = [];
		flushScheduled = false;
		channel?.postMessage({ events });
		addEvent("fs.broadcast.flush", Level.Internal, { count: events.length });
	});
};
