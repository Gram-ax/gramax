import type * as core from "@opentelemetry/core";
import type * as sdk from "@opentelemetry/sdk-trace-base";
import { otelSpanEncoder } from "../span";

export class StderrJsonExporter implements sdk.SpanExporter {
	export(spans: sdk.ReadableSpan[], resultCallback: (result: core.ExportResult) => void): void {
		for (const span of spans) {
			process.stderr.write(`${JSON.stringify(otelSpanEncoder.fromReadableSpan(span))}\n`);
		}
		resultCallback({ code: 0 });
	}

	shutdown(): Promise<void> {
		return Promise.resolve();
	}
}
