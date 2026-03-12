import type * as api from "@opentelemetry/api";
import { ExportResultCode } from "@opentelemetry/core";
import type * as sdk from "@opentelemetry/sdk-trace-base";

const RECENT_BUFFER_CAPACITY = 200;

export default class BufferedSpanProcessor implements sdk.SpanProcessor {
	private _pending = new Map<string, sdk.ReadableSpan[]>();

	private _recent: sdk.ReadableSpan[] = [];

	constructor(private _exporters: sdk.SpanExporter[]) {}

	onStart(_span: sdk.Span, _parentContext: api.Context): void {}

	onEnd(span: sdk.ReadableSpan): void {
		this._pushRecent(span);

		const traceId = span.spanContext().traceId;

		let buf = this._pending.get(traceId);
		if (!buf) {
			buf = [];
			this._pending.set(traceId, buf);
		}
		buf.push(span);

		if (!span.parentSpanContext) {
			this._pending.delete(traceId);
			this._exportSpans(buf);
		}
	}

	getRecent(): sdk.ReadableSpan[] {
		return this._recent.slice();
	}

	forceFlush(): Promise<void> {
		for (const [, spans] of this._pending) {
			this._exportSpans(spans);
		}
		this._pending.clear();
		return Promise.resolve();
	}

	async shutdown(): Promise<void> {
		await this.forceFlush();
		for (const exporter of this._exporters) {
			await exporter.shutdown();
		}
	}

	private _pushRecent(span: sdk.ReadableSpan): void {
		if (this._recent.length >= RECENT_BUFFER_CAPACITY)
			this._recent.splice(0, this._recent.length - RECENT_BUFFER_CAPACITY + 1);
		this._recent.push(span);
	}

	private _exportSpans(spans: sdk.ReadableSpan[]): void {
		for (const exporter of this._exporters) {
			exporter.export(spans, (result) => {
				if (result.code === ExportResultCode.FAILED) {
					console.error("Export failed:", result.error);
				}
			});
		}
	}
}
