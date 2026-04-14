import { env, getExecutingEnvironment } from "@app/resolveModule/env";
import type { ContextManager } from "@opentelemetry/api";
import type * as sdk from "@opentelemetry/sdk-trace-base";
import assert from "assert";
import { ConsoleLogExporter } from "./exporters/debug";
import IndexedDbExporter from "./exporters/indexed-db";
import TauriEventExporter from "./exporters/tauri-event";
import BufferedSpanProcessor from "./proccessors/buffered";
import DetectHangSpanProcessor from "./proccessors/detect-hang";
import type { Span } from "./span";

const createContextManager = async (): Promise<ContextManager> => {
	if (typeof window === "undefined") {
		const { AsyncHooksContextManager } = await import("@opentelemetry/context-async-hooks");
		const asyncHooks = new AsyncHooksContextManager();
		asyncHooks.enable();
		return asyncHooks;
	}
	const { ZoneContextManager } = await import("@opentelemetry/context-zone");
	return new ZoneContextManager();
};

const registerNext = async (): Promise<void> => {
	const [{ trace: traceNext, context }, { BasicTracerProvider, SimpleSpanProcessor }] = await Promise.all([
		import("@opentelemetry/api"),
		import("@opentelemetry/sdk-trace-base"),
	]);

	globalThis.otel.traceApi = traceNext;
	context.setGlobalContextManager(await createContextManager());

	const exporter: sdk.SpanExporter =
		typeof window === "undefined"
			? new (await import("./exporters/stderr-json")).StderrJsonExporter()
			: new ConsoleLogExporter({ level: "debug" });

	const provider = new BasicTracerProvider({ spanProcessors: [new SimpleSpanProcessor(exporter)] });
	traceNext.setGlobalTracerProvider(provider);
	globalThis.otel.tracerApi = provider.getTracer("app", env("GRAMAX_VERSION"));
};

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

	if (platform === "tauri") listenForRustSpans();
};

export const registerOtel = async (): Promise<void> => {
	globalThis.otel = {};
	assert(!globalThis.otel.registered, "can not register otel twice");

	if (getExecutingEnvironment() === "next") {
		await registerNext();
	} else {
		await registerBrowser();
	}

	globalThis.otel.registered = true;
};
