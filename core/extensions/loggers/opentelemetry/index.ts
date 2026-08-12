import { getCachedSetting } from "@ext/settings/logic/cachedSettingsStore";
import type * as api from "@opentelemetry/api";
import { context as apiContext, trace as apiTrace, createContextKey, SpanStatusCode } from "@opentelemetry/api";
import type IndexedDbExporter from "./exporters/indexed-db";
import type BufferedSpanProcessor from "./proccessors/buffered";
import { isLevelEnabled, Level, otelSpanEncoder, type Span, SpanAttribute, type ToSpan } from "./span";

declare global {
	interface globalThis {
		otel: {
			traceApi: api.TraceAPI;
			tracerApi: api.Tracer;
			bufferedSpanProcessor: BufferedSpanProcessor;
			indexedDbExporter?: IndexedDbExporter;
			registered: boolean;
			logLevel?: Level;
		};
	}
}

export const isOtelEnabled = (): boolean => globalThis?.otel?.registered;

/** Whether spans are echoed to the browser console — app setting `logging.console`. File/IndexedDB export is unaffected. */
export const isConsoleLoggingEnabled = (): boolean => getCachedSetting("logging.console") !== false;

/** Active minimum verbosity level. Spans/events more verbose than this are dropped at capture. */
export const getLogLevel = (): Level => globalThis?.otel?.logLevel ?? Level.Important;

export const setLogLevel = (level: Level): void => {
	if (globalThis?.otel) globalThis.otel.logLevel = level;
};
const getTraceApi = (): api.TraceAPI | undefined => globalThis?.otel?.traceApi;
const getTracer = (): api.Tracer | undefined => globalThis?.otel?.tracerApi;
const buildAttributes = (options?: TraceOptions) => {
	// biome-ignore lint/suspicious/noExplicitAny: required for opentelemetry
	const attrs: Record<string, any> = {};
	attrs[SpanAttribute.Level] = options?.level ?? Level.Commands;
	if (options?.omitArgs) {
		attrs[SpanAttribute.Args] = "<omitted>";
		return attrs;
	}

	if (options?.args !== undefined) attrs[SpanAttribute.Args] = otelSpanEncoder.serialize(options.args);
	return attrs;
};

interface TraceOptions {
	name?: string;
	args?: unknown[];
	links?: api.Link[];
	omitArgs?: boolean;
	omitResult?: boolean;
	/** Verbosity of this span. Default `Level.Commands`. More verbose than the active min level → span not created. */
	level?: Level;
}

export const getRecentSpans = () => {
	return globalThis?.otel?.bufferedSpanProcessor?.getRecent() ?? [];
};

/**
 * A span suppressed by the capture-time level filter. Kept as a lightweight frame (no SDK span created)
 * so that when a descendant throws, the whole suppressed ancestor chain can be materialized retroactively —
 * a failed span and its ancestors must survive filtering regardless of the active level.
 */
interface SuppressedFrame {
	name: string;
	options?: TraceOptions;
	startTime: number;
	parent?: SuppressedFrame;
	creationContext: api.Context;
	span?: api.Span;
	/** The frame's traced call already finished — a late materialization must end the span immediately. */
	done?: boolean;
}

const SUPPRESSED_FRAME_KEY = createContextKey("gramax-suppressed-span-frame");

const materializeFrame = (tracer: api.Tracer, frame: SuppressedFrame): api.Span => {
	if (frame.span) return frame.span;
	const parentContext = frame.parent
		? apiTrace.setSpan(frame.creationContext, materializeFrame(tracer, frame.parent))
		: frame.creationContext;
	frame.span = tracer.startSpan(
		frame.name,
		{ startTime: frame.startTime, attributes: buildAttributes(frame.options), links: frame.options?.links },
		parentContext,
	);
	if (frame.done) frame.span.end();
	return frame.span;
};

const recordFrameError = (tracer: api.Tracer, frame: SuppressedFrame, error: Error): void => {
	const materialized = materializeFrame(tracer, frame);
	if (error.cause) materialized.recordException(error.cause as Error);
	materialized.recordException(error);
	materialized.setStatus({ code: SpanStatusCode.ERROR, message: error.message });
};

const runSuppressed = <T>(
	tracer: api.Tracer,
	name: string,
	options: TraceOptions | undefined,
	fn: () => T | Promise<T>,
): T | Promise<T> => {
	const active = apiContext.active();
	const frame: SuppressedFrame = {
		name,
		options,
		startTime: Date.now(),
		parent: active.getValue(SUPPRESSED_FRAME_KEY) as SuppressedFrame | undefined,
		creationContext: active,
	};

	const finishFrame = () => {
		frame.done = true;
		frame.span?.end();
	};

	return apiContext.with(active.setValue(SUPPRESSED_FRAME_KEY, frame), () => {
		try {
			const result = fn();
			const isThenable = result && typeof (result as Promise<unknown>).then === "function";

			if (isThenable) {
				return (result as Promise<T>).then(
					(value) => {
						finishFrame();
						return value;
					},
					(error) => {
						recordFrameError(tracer, frame, error);
						finishFrame();
						throw error;
					},
				);
			}

			finishFrame();
			return result;
		} catch (error) {
			recordFrameError(tracer, frame, error);
			finishFrame();
			throw error;
		}
	});
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

	// Capture-time filter: skip span creation when more verbose than the active min level.
	// The suppressed frame is kept so a thrown error materializes this span (and its suppressed ancestors).
	if (!isLevelEnabled(options?.level ?? Level.Commands, getLogLevel()))
		return runSuppressed(tracer, name, options, fn);

	return apiContext.with(apiContext.active().deleteValue(SUPPRESSED_FRAME_KEY), () =>
		tracer.startActiveSpan(name, { attributes: buildAttributes(options), links: options?.links }, (span) => {
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

				if (options?.omitResult) {
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
		}),
	);
}

export const trace = (options?: TraceOptions) => {
	return (target: unknown, name: string, descriptor: PropertyDescriptor) => {
		const originalMethod = descriptor.value;

		const traceName = options?.name || `${target.constructor.name}.${name}`;

		descriptor.value = function (...args: unknown[]) {
			return traced(traceName, { ...options, args }, () => originalMethod.apply(this, args));
		};
	};
};

export const span = (): api.Span | undefined => {
	return getTraceApi()?.getActiveSpan();
};

/**
 * Add a level-tagged event to the active span. No-op when more verbose than the active min level,
 * or when there is no active span. Prefer this over `span()?.addEvent(...)` so events carry a level.
 * Fired inside a level-suppressed span, an event that itself passes the threshold (e.g. a Commands-level
 * error signal inside an Internal span) materializes the suppressed chain so the event lands on its real parent.
 */
export const addEvent = (name: string, level: Level = Level.Commands, attributes?: api.Attributes): void => {
	if (!isLevelEnabled(level, getLogLevel())) return;
	const attrs = { ...attributes, [SpanAttribute.Level]: level };

	const frame = apiContext.active().getValue(SUPPRESSED_FRAME_KEY) as SuppressedFrame | undefined;
	const tracer = getTracer();
	if (frame && !frame.done && tracer) {
		materializeFrame(tracer, frame).addEvent(name, attrs);
		return;
	}

	span()?.addEvent(name, attrs);
};

export const handleWasmSpans = async (spans: Span[]): Promise<void> => {
	if (isConsoleLoggingEnabled()) for (const s of spans) console.debug(s);
	if (globalThis?.otel?.indexedDbExporter) await globalThis.otel.indexedDbExporter.exportRaw(spans);
};

export type { ToSpan };
export { Level };
