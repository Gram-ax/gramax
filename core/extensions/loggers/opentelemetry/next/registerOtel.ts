import { env } from "@app/resolveModule/env";
import { AsyncHooksContextManager } from "@opentelemetry/context-async-hooks";
import type * as sdk from "@opentelemetry/sdk-trace-base";
import assert from "assert";

const registerNext = async (): Promise<void> => {
	const [{ trace: traceNext, context }, { BasicTracerProvider, SimpleSpanProcessor }] = await Promise.all([
		import("@opentelemetry/api"),
		import("@opentelemetry/sdk-trace-base"),
	]);

	globalThis.otel.traceApi = traceNext;
	const asyncHooks = new AsyncHooksContextManager();
	asyncHooks.enable();
	context.setGlobalContextManager(asyncHooks);

	const exporter: sdk.SpanExporter = new (await import("../exporters/stderr-json")).StderrJsonExporter();

	const provider = new BasicTracerProvider({ spanProcessors: [new SimpleSpanProcessor(exporter)] });
	traceNext.setGlobalTracerProvider(provider);
	globalThis.otel.tracerApi = provider.getTracer("app", env("GRAMAX_VERSION"));
};

export const registerOtel = async (): Promise<void> => {
	globalThis.otel = {};
	assert(!globalThis.otel.registered, "can not register otel twice");
	await registerNext();
	globalThis.otel.registered = true;
};
