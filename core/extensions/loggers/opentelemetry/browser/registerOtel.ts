import { env, getExecutingEnvironment } from "@app/resolveModule/env";
import type * as sdk from "@opentelemetry/sdk-trace-base";
import assert from "assert";
import { ConsoleLogExporter } from "../exporters/debug";
import IndexedDbExporter from "../exporters/indexed-db";
import TauriEventExporter from "../exporters/tauri-event";
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
		console.debug(event.payload);
	});
};

const registerBrowser = async (): Promise<void> => {
	const platform = getExecutingEnvironment();

	disableZonePatches();

	const [
		{ trace: traceBrowser },
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

	globalThis.otel.traceApi = traceBrowser;

	let persistentExporter: sdk.SpanExporter;
	if (platform === "tauri") {
		persistentExporter = await TauriEventExporter.init();
	} else {
		globalThis.otel.indexedDbExporter = await IndexedDbExporter.init();
		persistentExporter = globalThis.otel.indexedDbExporter;
	}

	globalThis.otel.bufferedSpanProcessor = new BufferedSpanProcessor([persistentExporter]);

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

	if (platform === "tauri") await listenForRustSpans();
};

export const registerOtel = async (): Promise<void> => {
	globalThis.otel = {};
	assert(!globalThis.otel.registered, "can not register otel twice");
	await registerBrowser();
	globalThis.otel.registered = true;
};
