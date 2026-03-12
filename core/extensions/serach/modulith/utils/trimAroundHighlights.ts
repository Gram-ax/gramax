import type { SearchResultMarkItem } from "@ics/modulith-search-domain/search";

type Span = { type: "text" | "highlight"; start: number; end: number; text: string };

export function trimAroundHighlights(items: SearchResultMarkItem[], context: number = 30): SearchResultMarkItem[] {
	const spans: Span[] = [];
	let pos = 0;
	for (const it of items) {
		const len = it.text.length;
		spans.push({ type: it.type, start: pos, end: pos + len, text: it.text });
		pos += len;
	}
	const totalLen = pos;

	const highlightRanges = spans.filter((s) => s.type === "highlight").map((s) => ({ start: s.start, end: s.end }));

	if (highlightRanges.length === 0) {
		return items;
	}

	const windows = highlightRanges
		.map((r) => ({ start: Math.max(0, r.start - context), end: Math.min(totalLen, r.end + context) }))
		.sort((a, b) => a.start - b.start);

	const merged: { start: number; end: number }[] = [];
	for (const w of windows) {
		if (merged.length === 0) {
			merged.push({ ...w });
			continue;
		}
		const last = merged[merged.length - 1];
		if (w.start <= last.end) {
			last.end = Math.max(last.end, w.end);
		} else {
			merged.push({ ...w });
		}
	}

	const out: SearchResultMarkItem[] = [];
	let lastEmittedEnd = 0;
	for (let i = 0; i < merged.length; i++) {
		const w = merged[i];

		if (out.length === 0) {
			if (w.start > 0) out.push({ type: "text", text: "..." });
		} else {
			if (lastEmittedEnd < w.start) out.push({ type: "text", text: "..." });
		}

		for (const s of spans) {
			if (s.end <= w.start) continue;
			if (s.start >= w.end) break;
			const segStart = Math.max(s.start, w.start) - s.start;
			const segEnd = Math.min(s.end, w.end) - s.start;
			const piece = s.text.slice(segStart, segEnd);
			if (piece.length === 0) continue;

			const newItem: SearchResultMarkItem =
				s.type === "highlight" ? { type: "highlight", text: piece } : { type: "text", text: piece };

			const lastOut = out[out.length - 1];
			if (lastOut && lastOut.type === "text" && newItem.type === "text") {
				lastOut.text += newItem.text;
			} else {
				out.push(newItem);
			}
		}

		lastEmittedEnd = w.end;
	}

	if (lastEmittedEnd < totalLen) {
		out.push({ type: "text", text: "..." });
	}

	return out;
}
