import assert from "assert";
import { agentConfig } from "../../core/agentConfig";

export type MarkdownHeading = {
	id: string;
	level: number;
	title: string;
	lineStart: number;
	lineEnd: number;
	charStart?: number;
	charEnd?: number;
	children: MarkdownHeading[];
};

export class MarkdownDocumentParser {
	private constructor() {}

	private static readonly _ATX_HEADING_RE = /^(#{1,6})\s+(.+?)\s*$/;
	private static readonly _ATTR_PAIR_RE = /(\w+)\s*=\s*(["'])(.*?)\2/g;

	static splitFirstParagraph(markdown: string): { firstParagraph: string; rest: string } {
		const [firstParagraph = "", ...rest] = markdown.replace(/\r\n/g, "\n").split(/\n\s*\n/);
		return { firstParagraph, rest: rest.join("\n\n") };
	}

	static getHeadingHierarchy(source: string, includeMarkdownHeadings = true): MarkdownHeading[] {
		return MarkdownDocumentParser._getHeadingHierarchy(source, agentConfig.readMaxChars, includeMarkdownHeadings);
	}

	static getHeadingSectionMarkdown(source: string, headingId: string, includeMarkdownHeadings = true): string {
		const { lineStart, lineEnd, charStart, charEnd } = MarkdownDocumentParser._findHeading(
			source,
			headingId,
			includeMarkdownHeadings,
		);
		return MarkdownDocumentParser._getLineRangeMarkdown(source, lineStart, lineEnd, charStart, charEnd);
	}

	static applyHeadingSectionEdit(source: string, headingId: string, content: string): string {
		const { lineStart, lineEnd } = MarkdownDocumentParser._findHeading(source, headingId);
		return MarkdownDocumentParser._applyLineRangeEdit(source, lineStart, lineEnd, content);
	}

	static parseXmlAttrs(attrString: string): Record<string, string> {
		const attrs: Record<string, string> = {};
		MarkdownDocumentParser._ATTR_PAIR_RE.lastIndex = 0;
		let match = MarkdownDocumentParser._ATTR_PAIR_RE.exec(attrString);
		while (match !== null) {
			attrs[match[1]!] = match[3] ?? "";
			match = MarkdownDocumentParser._ATTR_PAIR_RE.exec(attrString);
		}
		return attrs;
	}

	private static _applyLineRangeEdit(source: string, lineStart: number, lineEnd: number, content: string): string {
		const lines = source.split("\n");
		const replacement = content.length === 0 ? [] : content.split("\n");
		const lineCount = lines.length;

		let startIndex: number;
		let endIndexExclusive: number;
		if (lineEnd === lineStart - 1) {
			assert(
				lineStart >= 1 && lineStart <= lineCount + 1,
				`Invalid insert position: lineStart=${lineStart} (file has ${lineCount} lines)`,
			);
			startIndex = lineStart - 1;
			endIndexExclusive = lineStart - 1;
		} else {
			assert(
				lineStart <= lineEnd,
				`Invalid range: lineStart (${lineStart}) > lineEnd (${lineEnd}) and not an insert (lineEnd must be lineStart - 1)`,
			);
			assert(
				lineStart >= 1 && lineEnd <= lineCount && lineStart <= lineCount,
				`Invalid replace range: ${lineStart}–${lineEnd} (file has ${lineCount} lines)`,
			);
			startIndex = lineStart - 1;
			endIndexExclusive = lineEnd;
		}

		return [...lines.slice(0, startIndex), ...replacement, ...lines.slice(endIndexExclusive)].join("\n");
	}

	private static _getLineRangeMarkdown(
		source: string,
		lineStart: number,
		lineEnd: number,
		charStart?: number,
		charEnd?: number,
	): string {
		let text = source
			.split("\n")
			.slice(lineStart - 1, lineEnd)
			.join("\n");
		if (charStart !== undefined && charEnd !== undefined) {
			text = text.slice(charStart, charEnd);
		}
		return text;
	}

	private static _findHeading(source: string, headingId: string, includeMarkdownHeadings = true): MarkdownHeading {
		const heading = MarkdownDocumentParser._findHeadingRecursive(
			MarkdownDocumentParser.getHeadingHierarchy(source, includeMarkdownHeadings),
			headingId,
		);
		assert(heading, `Heading with id "${headingId}" not found.`);
		return heading;
	}

	private static _findHeadingRecursive(headings: MarkdownHeading[], headingId: string): MarkdownHeading | undefined {
		for (const node of headings) {
			if (node.id === headingId) return node;
			const found = MarkdownDocumentParser._findHeadingRecursive(node.children, headingId);
			if (found) return found;
		}
		return undefined;
	}

	private static _getFlatHeadings(source: string): MarkdownHeading[] {
		const lines = source.split("\n");
		const raw: Array<{ level: number; title: string; lineStart: number; id: string }> = [];
		const idSeen = new Map<string, number>();

		for (let i = 0; i < lines.length; i++) {
			const m = MarkdownDocumentParser._ATX_HEADING_RE.exec((lines[i] ?? "").trim());
			if (!m) continue;
			const title = m[2]!.trim();
			const base =
				title
					.toLowerCase()
					.replace(/[`*_~]/g, "")
					.replace(/[^\p{L}\p{N}\s-]/gu, "")
					.trim()
					.replace(/\s+/g, "-") || `h-${i + 1}`;
			const n = (idSeen.get(base) ?? 0) + 1;
			idSeen.set(base, n);
			raw.push({ level: m[1]!.length, title, lineStart: i + 1, id: n === 1 ? base : `${base}-${n}` });
		}

		return raw.map((h, i) => {
			const level = h.level;
			let lineEnd = lines.length;
			for (let j = i + 1; j < raw.length; j++) {
				if (raw[j]!.level <= level) {
					lineEnd = raw[j]!.lineStart - 1;
					break;
				}
			}
			return { ...h, lineEnd, children: [] };
		});
	}

	private static _getHeadingHierarchy(
		content: string,
		maxChars: number,
		includeMarkdownHeadings = true,
	): MarkdownHeading[] {
		const lines = content.split("\n");
		const flat = includeMarkdownHeadings ? MarkdownDocumentParser._getFlatHeadings(content) : [];
		if (flat.length === 0 && content.length <= maxChars) return [];

		const root: MarkdownHeading = {
			id: "",
			level: 0,
			title: "",
			lineStart: 1,
			lineEnd: lines.length || 1,
			children: [],
		};
		const stack: MarkdownHeading[] = [];
		for (const cur of flat) {
			const node: MarkdownHeading = {
				id: cur.id,
				level: cur.level,
				title: cur.title,
				lineStart: cur.lineStart,
				lineEnd: cur.lineEnd,
				children: [],
			};
			while (stack.length && stack[stack.length - 1]!.level >= node.level) stack.pop();
			const parent = stack[stack.length - 1];
			if (parent) parent.children.push(node);
			else root.children.push(node);
			stack.push(node);
		}

		const headingHierarchy = MarkdownDocumentParser._getHeadingHierarchyRecursive(root, lines, maxChars);
		return headingHierarchy[0].children;
	}

	private static _getHeadingHierarchyRecursive(
		node: MarkdownHeading,
		lines: string[],
		maxChars: number,
	): MarkdownHeading[] {
		const children = node.children.flatMap((child) =>
			MarkdownDocumentParser._getHeadingHierarchyRecursive(child, lines, maxChars),
		);

		const slice = (start: number, end: number) => lines.slice(start - 1, end).join("\n");
		const chunkMeta = node.id
			? {
					baseId: node.id,
					level: node.level,
					title: node.title,
				}
			: undefined;

		if (node.children.length === 0) {
			if (slice(node.lineStart, node.lineEnd).length <= maxChars) return [{ ...node, children: [] }];
			const chunks = MarkdownDocumentParser._splitChunks(
				lines,
				node.lineStart,
				node.lineEnd,
				maxChars,
				chunkMeta,
			);
			return node.id ? chunks : [{ ...node, children: chunks }];
		}

		const preambleEnd = node.children[0]!.lineStart - 1;
		const preamble = preambleEnd >= node.lineStart ? slice(node.lineStart, preambleEnd) : "";
		const nodeContentLength = slice(node.lineStart, node.lineEnd).length;
		const preambleChunks =
			preamble.length > maxChars || (!node.id && nodeContentLength > maxChars && preamble.trim().length > 0)
				? MarkdownDocumentParser._splitChunks(lines, node.lineStart, preambleEnd, maxChars, chunkMeta)
				: [];

		return [{ ...node, children: [...preambleChunks, ...children] }];
	}

	private static _getChunkHeading(
		meta: { baseId: string; title: string } | undefined,
		chunkIndex: number,
		charStart?: number,
		charEnd?: number,
	): { id: string; title: string } {
		const id = meta ? `${meta.baseId}-chunk~${chunkIndex}` : `chunk~${chunkIndex}`;
		const label = meta ? `${meta.title} chunk~${chunkIndex}` : `chunk~${chunkIndex}`;
		const title =
			charStart !== undefined && charEnd !== undefined ? `${label} [chars ${charStart + 1}:${charEnd}]` : label;
		return { id, title };
	}

	private static _splitChunks(
		lines: string[],
		lineStart: number,
		lineEnd: number,
		maxChars: number,
		meta?: { baseId: string; level: number; title: string },
	): MarkdownHeading[] {
		const chunks: MarkdownHeading[] = [];
		let curStart = lineStart;
		let chunkIndex = 1;

		const pushChunk = (start: number, end: number, charStart?: number, charEnd?: number) => {
			const { id, title } = MarkdownDocumentParser._getChunkHeading(meta, chunkIndex, charStart, charEnd);
			chunks.push({
				id,
				level: meta?.level ?? 1,
				title,
				lineStart: start,
				lineEnd: end,
				...(charStart !== undefined && charEnd !== undefined ? { charStart, charEnd } : {}),
				children: [],
			});
			chunkIndex++;
		};

		while (curStart <= lineEnd) {
			const line = lines[curStart - 1] ?? "";
			if (line.length > maxChars) {
				for (let pos = 0; pos < line.length; pos += maxChars) {
					pushChunk(curStart, curStart, pos, Math.min(pos + maxChars, line.length));
				}
				curStart++;
				continue;
			}

			let curEnd = curStart;
			let size = 0;

			while (curEnd <= lineEnd) {
				const nextLine = lines[curEnd - 1] ?? "";
				if (nextLine.length > maxChars) break;

				const separator = curEnd > curStart ? 1 : 0;
				const addSize = separator + nextLine.length;
				if (size + addSize > maxChars && curEnd > curStart) break;
				size += addSize;
				curEnd++;
			}

			pushChunk(curStart, curEnd - 1);
			curStart = curEnd;
		}

		return chunks;
	}
}
