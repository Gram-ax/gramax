import type * as api from "@opentelemetry/api";
import { SpanStatusCode } from "@opentelemetry/api";
import type * as sdk from "@opentelemetry/sdk-trace-base";

export default class DetectHangSpanProcessor implements sdk.SpanProcessor {
	private _timers: Map<string, NodeJS.Timeout> = new Map();

	constructor(
		private _inner: sdk.SpanProcessor[],
		private _warnTimeout: number,
		private _forceEndTimeout: number,
	) {}

	onStart(span: sdk.Span, parentContext: api.Context): void {
		if (this._timers.has(span.parentSpanContext?.spanId)) {
			clearTimeout(this._timers.get(span.parentSpanContext.spanId));
		}

		const capture = () => {
			return new Error().stack;
		};

		this._timers.set(
			span.spanContext().spanId,
			setTimeout(() => {
				this._timers.set(
					span.spanContext().spanId,
					setTimeout(() => {
						span.addEvent("hung operation detected", { stack: capture() });
						span.setStatus({ code: SpanStatusCode.ERROR });
						span.end();
					}, this._forceEndTimeout - this._warnTimeout),
				);

				span.addEvent("long-running operation detected");
			}, this._warnTimeout),
		);

		this._inner.forEach((processor) => processor.onStart(span, parentContext));
	}

	onEnding(span: sdk.Span): void {
		this._inner.forEach((processor) => processor.onEnding?.(span));
	}

	onEnd(span: sdk.ReadableSpan): void {
		if (this._timers.has(span.spanContext().spanId)) {
			clearTimeout(this._timers.get(span.spanContext().spanId));
		}

		this._inner.forEach((processor) => processor.onEnd(span));
	}

	async forceFlush(): Promise<void> {
		await this._inner.forEachAsync((processor) => processor.forceFlush());
	}

	async shutdown() {
		this._timers.forEach((t) => clearTimeout(t));

		await this._inner.forEachAsync((processor) => processor.shutdown());
	}
}
