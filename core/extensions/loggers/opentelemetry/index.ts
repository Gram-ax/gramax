import type * as api from "@opentelemetry/api";
import { SpanStatusCode } from "@opentelemetry/api";
import type IndexedDbExporter from "./exporters/indexed-db";
import type BufferedSpanProcessor from "./proccessors/buffered";
import { otelSpanEncoder, type Span, SpanAttribute, type ToSpan } from "./span";

declare global {
	interface globalThis {
		otel: {
			traceApi: api.TraceAPI;
			tracerApi: api.Tracer;
			bufferedSpanProcessor: BufferedSpanProcessor;
			indexedDbExporter: IndexedDbExporter;
			registered: boolean;
		};
	}
}

const isOtelEnabled = (): boolean => globalThis?.otel?.registered;
const getTraceApi = (): api.TraceAPI | undefined => globalThis?.otel?.traceApi;
const getTracer = (): api.Tracer | undefined => globalThis?.otel?.tracerApi;
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

interface TraceOptions {
	args?: unknown[];
	links?: api.Link[];
	omitArgs?: boolean;
	omitResult?: boolean;
}

export const getRecentSpans = () => {
	return globalThis?.otel?.bufferedSpanProcessor?.getRecent() ?? [];
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
	if (globalThis?.otel?.indexedDbExporter) await globalThis.otel.indexedDbExporter.exportRaw(spans);
};

export type { ToSpan };
