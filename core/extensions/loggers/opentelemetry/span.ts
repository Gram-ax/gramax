import type * as api from "@opentelemetry/api";
import type * as sdk from "@opentelemetry/sdk-trace-base";

export interface ToSpan {
	toSpan(): unknown;
}

export enum SpanAttribute {
	Args = "args",
	Result = "res",
}

export type Span = {
	name: string;
	spanId: string;
	traceId: string;
	error?: string;
	args?: unknown;
	result?: unknown;
	attrs?: api.Attributes | unknown;
	events?: sdk.TimedEvent[];
	parentSpanId?: string;
	duration: number;
	timestamp: number;
};

export class OtelSpanEncoder {
	fromReadableSpan(span: sdk.ReadableSpan): Span {
		const duration = span.duration[0] * 1000 + span.duration[1] / 1000000; // convert from [sec, nsec] to ms
		const hasError = span.status.code === 2;
		const parent = span.parentSpanContext;
		const events = span.events;

		const attrs = span.attributes;
		Object.entries(attrs).forEach(([key, value]) => {
			attrs[key] = otelSpanEncoder.deserialize(value);
		});

		return {
			name: span.name,
			spanId: span.spanContext().spanId,
			traceId: span.spanContext().traceId,
			parentSpanId: parent ? parent.spanId : undefined,
			attrs,
			events,
			error: hasError ? span.status.message : undefined,
			duration: duration,
			timestamp: span.startTime[0],
		};
	}

	deserialize<T = unknown>(value: api.AttributeValue): T {
		try {
			if (typeof value === "string") return JSON.parse(value);
			return value as T;
		} catch {
			return value as T;
		}
	}

	serialize(value: unknown): api.AttributeValue {
		const limit = 2600;
		try {
			if (typeof value === "number" || typeof value === "string" || typeof value === "boolean") return value;
			if (typeof value === "function") return "function";

			const resolved = this._resolveDeep(value);
			const json = JSON.stringify(resolved);
			return json?.length > limit ? `<${json.length - limit} more> ${json.slice(0, limit)} ..` : json;
		} catch (e) {
			console.error("failed to serialize span", e, value);
			return `${value}`;
		}
	}

	private _resolveDeep(value: unknown, depth = 0, limit = 12, seen: WeakSet<object> = new WeakSet()): unknown {
		if (value === null || value === undefined) return value;
		if (typeof value !== "object") return value;

		if (seen.has(value)) return "<circular>";
		seen.add(value);

		if ("then" in value && typeof value.then === "function") return "<promise>";
		if ("toSpan" in value && typeof value.toSpan === "function") {
			const span = value.toSpan();
			if (typeof span === "object" && span !== null) {
				if (value.constructor) span.constructor = value.constructor.name;
				return this._resolveDeep(span, depth + 1, limit, seen);
			}
			return span;
		}

		if (depth >= limit) {
			const name = value.constructor?.name;
			return name && name !== "Object" && name !== "Array" ? `<object ${name}>` : "[...]";
		}

		if (Array.isArray(value)) return value.map((v) => this._resolveDeep(v, depth + 1, limit, seen));

		const out: Record<string, unknown> = {};
		for (const [k, v] of Object.entries(value)) {
			out[k] = this._resolveDeep(v, depth + 1, limit, seen);
		}
		return out;
	}
}

export const otelSpanEncoder = new OtelSpanEncoder();
