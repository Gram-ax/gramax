import { Label } from "@ui-kit/Label";
import type { ReactNode } from "react";
import { isPlainObject } from "../utils/agentTimeline";

function SectionBox({ label, children }: { label: string; children: ReactNode }) {
	return (
		<div className="space-y-1">
			<Label>{label}</Label>
			<div className="w-full rounded-lg border border-secondary-border bg-secondary-bg px-3 py-2.5 shadow-soft-sm outline-none transition-colors lg:py-2 text-sm text-primary-fg min-h-14">
				{children}
			</div>
		</div>
	);
}

function PayloadValue({ value }: { value: unknown }) {
	if (value === null || value === undefined) return "—";

	if (typeof value === "string") {
		return <span className="whitespace-pre-wrap break-words">{value}</span>;
	}

	if (Array.isArray(value)) {
		return (
			<ul className="inline-block align-top list-disc space-y-1 pl-5">
				{value.map((item, index) => (
					<li key={`${index}-${typeof item === "object" ? "obj" : String(item)}`}>
						<PayloadValue value={item} />
					</li>
				))}
			</ul>
		);
	}

	if (isPlainObject(value)) {
		return (
			<div className="space-y-0.5">
				{Object.entries(value).map(([k, v]) => (
					<PayloadEntry key={k} name={k} value={v} />
				))}
			</div>
		);
	}

	return <span>{String(value)}</span>;
}

function PayloadEntry({ name, value }: { name: string; value: unknown }) {
	return (
		<div className="text-xs text-secondary-fg flex flex-wrap gap-1">
			<span className="font-medium text-muted-foreground ">{name}:</span>
			<PayloadValue value={value} />
		</div>
	);
}

export function ToolPayloadSection({
	label,
	payload: payloadProp,
	filterKeys,
}: {
	label: string;
	payload?: Record<string, unknown>;
	filterKeys?: string[];
}) {
	if (!payloadProp) return null;

	const payload = Object.fromEntries(
		Object.entries(payloadProp).filter(([k, v]) => v !== undefined && !filterKeys?.includes(k)),
	);
	if (Object.keys(payload).length === 0) return null;

	return (
		<SectionBox label={label}>
			<PayloadValue value={payload} />
		</SectionBox>
	);
}

function tryParseJson(text: string): { ok: true; value: unknown } | { ok: false } {
	try {
		return { ok: true, value: JSON.parse(text) };
	} catch {
		return { ok: false };
	}
}

export function ToolResultSection({
	label,
	contentPreview,
	fullLength,
}: {
	label: string;
	contentPreview?: string;
	fullLength?: number;
}) {
	if (!contentPreview) return null;

	const truncated = typeof fullLength === "number" && fullLength > 0 && contentPreview.length < fullLength;

	const parsed = !truncated ? tryParseJson(contentPreview) : { ok: false as const };

	return (
		<SectionBox label={label}>
			{parsed.ok ? (
				<PayloadValue value={parsed.value} />
			) : (
				<pre className="w-full overflow-x-auto whitespace-pre-wrap break-words font-mono text-xs leading-relaxed m-0">
					{contentPreview}
				</pre>
			)}
			{truncated && <div className="mt-1 text-[11px] text-muted-foreground">{fullLength} chars total</div>}
		</SectionBox>
	);
}
