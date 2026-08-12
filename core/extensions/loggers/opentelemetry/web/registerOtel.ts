import { env, getExecutingEnvironment } from "@app/resolveModule/env";
import type * as sdk from "@opentelemetry/sdk-trace-base";
import assert from "assert";
import { ConsoleLogExporter } from "../exporters/debug";
import IndexedDbExporter from "../exporters/indexed-db";
import TauriEventExporter from "../exporters/tauri-event";
import { isConsoleLoggingEnabled } from "../index";
import { getActiveLogLevel, pushLogLevelToRust } from "../logLevel";
import BufferedSpanProcessor from "../proccessors/buffered";
import DetectHangSpanProcessor from "../proccessors/detect-hang";
import type { Span } from "../span";

const disableZonePatches = () => {
	const g = globalThis as Record<string, unknown>;
	g.__Zone_disable_MessageChannel = true;
	g.__Zone_disable_requestAnimationFrame = true;
	g.__Zone_disable_MutationObserver = true;
	g.__Zone_disable_IntersectionObserver = true;
	g.__Zone_disable_geolocation = true;
	g.__Zone_disable_canvas = true;
	g.__Zone_disable_blocking = true;
};

const listenForRustSpans = async () => {
	const { listen } = await import("@tauri-apps/api/event");
	void listen<Span>("otel-rust", (event) => {
		if (isConsoleLoggingEnabled()) console.debug(event.payload);
	});
};

const registerWeb = async (): Promise<void> => {
	const platform = getExecutingEnvironment();

	disableZonePatches();

	const [
		{ trace: traceWeb },
		{ registerInstrumentations },
		{ LongTaskInstrumentation },
		{ SimpleSpanProcessor },
		{ WebTracerProvider },
		{ ZoneContextManager },
	] = await Promise.all([
		import("@opentelemetry/api"),
		import("@opentelemetry/instrumentation"),
		import("@opentelemetry/instrumentation-long-task"),
		import("@opentelemetry/sdk-trace-base"),
		import("@opentelemetry/sdk-trace-web"),
		import("@opentelemetry/context-zone"),
	]);

	globalThis.otel.traceApi = traceWeb;

	const exporters: sdk.SpanExporter[] = [];
	if (platform === "tauri") {
		// Desktop persists spans through the Rust NDJSON pipeline (TauriEventExporter → "otel" → gx-*.ndjson).
		// IndexedDB would be a redundant second store there, so it stays web-only; export reads the ndjson files.
		exporters.push(await TauriEventExporter.init());
	} else {
		globalThis.otel.indexedDbExporter = await IndexedDbExporter.init();
		exporters.push(globalThis.otel.indexedDbExporter);
	}

	globalThis.otel.bufferedSpanProcessor = new BufferedSpanProcessor(exporters);

	const provider = new WebTracerProvider({
		spanProcessors: [
			new DetectHangSpanProcessor(
				[
					new SimpleSpanProcessor(new ConsoleLogExporter({ level: "debug" })),
					globalThis.otel.bufferedSpanProcessor,
				],
				20_000,
				125_000,
			),
		],
	});

	provider.register({ contextManager: new ZoneContextManager() });
	registerInstrumentations({ instrumentations: [new LongTaskInstrumentation()] });

	globalThis.otel.tracerApi = provider.getTracer("app", env("GRAMAX_VERSION"));

	globalThis.otel.logLevel = getActiveLogLevel();
	if (platform === "tauri") {
		await listenForRustSpans();
		void pushLogLevelToRust(globalThis.otel.logLevel);
	}
};

export const registerOtel = async (): Promise<void> => {
	globalThis.otel = {};
	assert(!globalThis.otel.registered, "can not register otel twice");
	await registerWeb();
	globalThis.otel.registered = true;
};
