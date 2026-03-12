import { type ExportResult, ExportResultCode } from "@opentelemetry/core";
import type * as sdk from "@opentelemetry/sdk-trace-base";
import { otelSpanEncoder } from "../span";

export default class TauriEventExporter implements sdk.SpanExporter {
	private constructor(private _emit: typeof import("@tauri-apps/api/event")["emit"]) {}

	static async init() {
		return new this((await import("@tauri-apps/api/event")).emit);
	}

	async export(spans: sdk.ReadableSpan[], resultCallback: (result: ExportResult) => void) {
		const encoded = spans.map((s) => otelSpanEncoder.fromReadableSpan(s));
		await this._emit("otel", encoded);
		resultCallback({ code: ExportResultCode.SUCCESS });
	}

	shutdown(): Promise<void> {
		return Promise.resolve();
	}
}
