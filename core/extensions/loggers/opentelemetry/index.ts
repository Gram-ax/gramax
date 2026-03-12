import { env, getExecutingEnvironment } from "@app/resolveModule/env";
import type * as api from "@opentelemetry/api";
import { type ContextManager, SpanStatusCode } from "@opentelemetry/api";
import type * as sdk from "@opentelemetry/sdk-trace-base";
import assert from "assert";
import { ConsoleLogExporter } from "./exporters/debug";
import IndexedDbExporter from "./exporters/indexed-db";
import TauriEventExporter from "./exporters/tauri-event";
import BufferedSpanProcessor from "./proccessors/buffered";
import DetectHangSpanProcessor from "./proccessors/detect-hang";
import { otelSpanEncoder, type Span, SpanAttribute, type ToSpan } from "./span";

let registered = false;
let traceApi: api.TraceAPI | undefined;
let tracerApi: api.Tracer | undefined;
let bufferedSpanProcessor: BufferedSpanProcessor | undefined;
let indexedDbExporter: IndexedDbExporter | undefined;

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
	const [{ trace, context }, { BasicTracerProvider, SimpleSpanProcessor }] = await Promise.all([
		import("@opentelemetry/api"),
		import("@opentelemetry/sdk-trace-base"),
	]);

	traceApi = trace;
	context.setGlobalContextManager(await createContextManager());

	const exporter: sdk.SpanExporter =
		typeof window === "undefined"
			? new (await import("./exporters/stderr-json")).StderrJsonExporter()
			: new ConsoleLogExporter({ level: "debug" });

	const provider = new BasicTracerProvider({ spanProcessors: [new SimpleSpanProcessor(exporter)] });
	trace.setGlobalTracerProvider(provider);
	tracerApi = provider.getTracer("app", env("GRAMAX_VERSION"));
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

const registerBrowser = async (): Promise<void> => {
	const platform = getExecutingEnvironment();

	disableZonePatches();

	const [
		{ trace },
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

	traceApi = trace;

	let persistentExporter: sdk.SpanExporter;
	if (platform === "tauri") {
		persistentExporter = await TauriEventExporter.init();
	} else {
		indexedDbExporter = await IndexedDbExporter.init();
		persistentExporter = indexedDbExporter;
	}

	bufferedSpanProcessor = new BufferedSpanProcessor([persistentExporter]);

	const provider = new WebTracerProvider({
		spanProcessors: [
			new DetectHangSpanProcessor(
				[new SimpleSpanProcessor(new ConsoleLogExporter({ level: "debug" })), bufferedSpanProcessor],
				20_000,
				125_000,
			),
		],
	});

	provider.register({ contextManager: new ZoneContextManager() });
	registerInstrumentations({ instrumentations: [new LongTaskInstrumentation()] });

	tracerApi = provider.getTracer("app", env("GRAMAX_VERSION"));

	if (platform === "tauri") listenForRustSpans();
};

export const registerOtel = async (): Promise<void> => {
	assert(!registered, "can not register otel twice");

	if (getExecutingEnvironment() === "next") {
		await registerNext();
	} else {
		await registerBrowser();
	}

	registered = true;
};

export const isOtelEnabled = (): boolean => registered;
export const getTraceApi = (): api.TraceAPI | undefined => traceApi;
export const getTracer = (): api.Tracer | undefined => tracerApi;

export const getRecentSpans = () => {
	return bufferedSpanProcessor?.getRecent() ?? [];
};

export interface TraceOptions {
	args?: unknown[];
	links?: api.Link[];
	omitArgs?: boolean;
	omitResult?: boolean;
}

const buildAttributes = (options?: TraceOptions) => {
	// biome-ignore lint/suspicious/noExplicitAny: required for opentelemetry
	const attrs: Record<string, any> = {};
	if (options?.omitArgs) {
		attrs[SpanAttribute.Args] = "<omitted>";
		return attrs;
	}

	if (options?.args !== undefined) attrs[SpanAttribute.Args] = otelSpanEncoder.serialize(options.args);
	return attrs;
};

export function traced<T>(name: string, fn: () => Promise<T>): Promise<T>;
export function traced<T>(name: string, fn: () => T): T;
export function traced<T>(name: string, options: TraceOptions, fn: () => Promise<T>): Promise<T>;
export function traced<T>(name: string, options: TraceOptions, fn: () => T): T;

export function traced<T>(
	name: string,
	optionsOrFn: TraceOptions | (() => T | Promise<T>),
	maybeFn?: () => T | Promise<T>,
): T | Promise<T> {
	const tracer = getTracer();
	if (!isOtelEnabled() || !tracer) return typeof optionsOrFn === "function" ? optionsOrFn() : maybeFn!();

	const options = typeof optionsOrFn === "function" ? undefined : optionsOrFn;
	const fn = typeof optionsOrFn === "function" ? optionsOrFn : maybeFn!;

	return tracer.startActiveSpan(name, { attributes: buildAttributes(options), links: options?.links }, (span) => {
		try {
			const result = fn();
			const isThenable = result && typeof (result as Promise<unknown>).then === "function";

			if (isThenable) {
				return (result as Promise<unknown>).then(
					(value) => {
						if (options?.omitResult) {
							span.setAttribute(SpanAttribute.Result, "<omitted>");
						} else {
							span.setAttribute(SpanAttribute.Result, otelSpanEncoder.serialize(value));
						}
						span.end();
						return value;
					},
					(error) => {
						if (error.cause) span.recordException(error.cause);
						span.recordException(error);
						span.setStatus({ code: SpanStatusCode.ERROR, message: error.message });
						span.end();
						throw error;
					},
				) as T | Promise<T>;
			}

			if (!options?.omitResult) {
				span.setAttribute(SpanAttribute.Result, "<omitted>");
			} else {
				span.setAttribute(SpanAttribute.Result, otelSpanEncoder.serialize(result));
			}
			span.end();
			return result;
		} catch (error) {
			if (error.cause) span.recordException(error.cause);
			span.recordException(error);
			span.setStatus({ code: SpanStatusCode.ERROR, message: error.message });
			span.end();
			throw error;
		}
	});
}

const listenForRustSpans = async () => {
	const { listen } = await import("@tauri-apps/api/event");
	void listen<Span>("otel-rust", (event) => {
		console.debug(event.payload);
	});
};

export const trace = (options?: TraceOptions) => {
	return (target: unknown, name: string, descriptor: PropertyDescriptor) => {
		const originalMethod = descriptor.value;

		descriptor.value = function (...args: unknown[]) {
			return traced(`${target.constructor.name}.${name}`, { ...options, args }, () =>
				originalMethod.apply(this, args),
			);
		};
	};
};

export const span = (): api.Span | undefined => {
	return getTraceApi()?.getActiveSpan();
};

export const handleWasmSpans = async (spans: Span[]): Promise<void> => {
	for (const s of spans) console.debug(s);
	if (indexedDbExporter) await indexedDbExporter.exportRaw(spans);
};

export type { ToSpan };
