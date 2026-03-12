import type * as core from "@opentelemetry/core";
import type * as sdk from "@opentelemetry/sdk-trace-base";
import { otelSpanEncoder } from "../span";

export type ConsoleLogExporterOptions = {
	level?: "debug" | "info" | "warn" | "error";
	filter?: (span: sdk.ReadableSpan) => boolean;
};

export class ConsoleLogExporter {
	constructor(private _opts: ConsoleLogExporterOptions = {}) {}

	export(spans: sdk.ReadableSpan[], resultCallback: (result: core.ExportResult) => void): void {
		for (const span of spans) {
			if (!!this._opts.filter && !this._opts.filter?.(span)) continue;

			switch (this._opts.level) {
				case "info":
					console.info(otelSpanEncoder.fromReadableSpan(span));
					break;
				case "warn":
					console.warn(otelSpanEncoder.fromReadableSpan(span));
					break;
				case "error":
					console.error(otelSpanEncoder.fromReadableSpan(span));
					break;
				default:
					console.debug(otelSpanEncoder.fromReadableSpan(span));
					break;
			}
		}

		resultCallback({ code: 0 });
	}

	shutdown(): Promise<void> {
		return Promise.resolve();
	}
}
