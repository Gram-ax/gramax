import { env } from "@app/resolveModule/env";
import { AsyncLocalStorageContextManager } from "@opentelemetry/context-async-hooks";
import type * as sdk from "@opentelemetry/sdk-trace-base";
import assert from "assert";
import { Level } from "../span";

/** SSR has no settings UI — the min level comes from `GRAMAX_LOG_LEVEL` (off|commands|important|internal|files|full), default `important`. */
const envLogLevel = (): Level => {
	const raw = env("GRAMAX_LOG_LEVEL")?.toLowerCase();
	return Object.values(Level).includes(raw as Level) ? (raw as Level) : Level.Important;
};

const registerNext = async (): Promise<void> => {
	const [{ trace: traceNext, context }, { BasicTracerProvider, SimpleSpanProcessor }] = await Promise.all([
		import("@opentelemetry/api"),
		import("@opentelemetry/sdk-trace-base"),
	]);

	globalThis.otel.traceApi = traceNext;
	const asyncHooks = new AsyncLocalStorageContextManager();
	asyncHooks.enable();
	context.setGlobalContextManager(asyncHooks);

	const exporter: sdk.SpanExporter = new (await import("../exporters/stderr-json")).StderrJsonExporter();

	const provider = new BasicTracerProvider({ spanProcessors: [new SimpleSpanProcessor(exporter)] });
	traceNext.setGlobalTracerProvider(provider);
	globalThis.otel.tracerApi = provider.getTracer("app", env("GRAMAX_VERSION"));
	globalThis.otel.logLevel = envLogLevel();
};

export const registerOtel = async (): Promise<void> => {
	globalThis.otel = {};
	assert(!globalThis.otel.registered, "can not register otel twice");
	await registerNext();
	globalThis.otel.registered = true;
};
