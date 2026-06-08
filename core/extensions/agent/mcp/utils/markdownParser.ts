import Path from "@core/FileProvider/Path/Path";

export type MarkdownHeading = {
	id: string;
	level: number;
	title: string;
	lineStart: number;
	lineEnd: number;
	children: MarkdownHeading[];
};

export type NumberedLine = {
	line: number;
	text: string;
};

export class MarkdownDocumentParser {
	readonly source: string;
	static readonly ATX_HEADING_RE = /^(#{1,6})\s+(.+?)\s*$/;
	static readonly MERMAID_PATH_TAG_RE = /<mermaid\s+path\s*=\s*(["'])([^"']*)\1\s*\/>/gi;

	private constructor(source: string) {
		this.source = source;
	}

	static fromRawMarkdown(markdown: string): MarkdownDocumentParser {
		return new MarkdownDocumentParser(markdown);
	}

	static fromGramaxItem(item: { type: string; content?: string | null }): MarkdownDocumentParser {
		if (item.type !== "article" && item.type !== "category") {
			throw new Error(
				`MarkdownDocumentParser: unsupported item type "${item.type}" (expected article or category)`,
			);
		}
		return MarkdownDocumentParser.fromRawMarkdown(item.content ?? "");
	}

	static parseTitleFromFirstContentLine(markdown: string): string | undefined {
		return MarkdownDocumentParser.findFirstContentHeading(markdown)?.title;
	}

	static buildVirtualArticleForRead(storageMarkdown: string, propsTitle: string | undefined): string {
		const t = propsTitle?.trim();
		if (!t) return storageMarkdown;
		const h1InFile = MarkdownDocumentParser.parseH1TitleFromFirstContentLine(storageMarkdown);
		let body = storageMarkdown;
		if (h1InFile !== undefined && h1InFile === t) {
			body = MarkdownDocumentParser.stripFirstAtxHeadingLine(storageMarkdown);
		}
		return `# ${t}\n${body}`;
	}

	static splitForAgentStorage(markdown: string): {
		title: string | undefined;
		storageBody: string;
	} {
		const title = MarkdownDocumentParser.parseTitleFromFirstContentLine(markdown);
		if (title === undefined) {
			return { title: undefined, storageBody: markdown };
		}
		return {
			title,
			storageBody: MarkdownDocumentParser.stripFirstAtxHeadingLine(markdown),
		};
	}

	getRawMarkdown(): string {
		return this.source;
	}

	getNumberedLines(): NumberedLine[] {
		const lines = MarkdownDocumentParser.toLines(this.source);
		return lines.map((text, i) => ({ line: i + 1, text }));
	}

	getNumberedLinesInRange(lineStart: number, lineEnd: number): NumberedLine[] {
		const all = this.getNumberedLines();
		return all.filter((row) => row.line >= lineStart && row.line <= lineEnd);
	}

	getFlatHeadings(): MarkdownHeading[] {
		return MarkdownDocumentParser.parseFlatHeadings(this.source);
	}

	getHeadingHierarchy(): MarkdownHeading[] {
		const flat = MarkdownDocumentParser.parseFlatHeadings(this.source);
		return MarkdownDocumentParser.flatToHierarchy(flat);
	}

	applyLineRangeEdit(lineStart: number, lineEnd: number, content: string): string {
		return MarkdownDocumentParser.applyLineRangeEditToSource(this.source, lineStart, lineEnd, content);
	}

	async expandMermaidPathTags(
		articleDir: Path,
		readLinkedFile: (pathFromTag: string) => Promise<string>,
	): Promise<MarkdownDocumentParser> {
		const next = await MarkdownDocumentParser.expandMermaidPathTagsInSource(
			this.source,
			articleDir,
			readLinkedFile,
		);
		return new MarkdownDocumentParser(next);
	}

	static toLines(markdown: string): string[] {
		return markdown.split("\n");
	}

	static parseAtxHeading(line: string): { level: number; title: string } | undefined {
		const m = MarkdownDocumentParser.ATX_HEADING_RE.exec(line.trim());
		if (!m) return undefined;
		return { level: m[1]!.length, title: m[2]!.trim() };
	}

	static findFirstContentHeading(
		markdown: string,
		options: { onlyH1?: boolean } = {},
	): { level: number; title: string; lineIndex: number } | undefined {
		if (!markdown) return undefined;
		const lines = MarkdownDocumentParser.toLines(markdown);
		for (let i = 0; i < lines.length; i++) {
			const trimmed = lines[i]!.trim();
			if (!trimmed) continue;
			const heading = MarkdownDocumentParser.parseAtxHeading(trimmed);
			if (!heading) return undefined;
			if (options.onlyH1 && heading.level !== 1) return undefined;
			return { ...heading, lineIndex: i };
		}
		return undefined;
	}

	static stripFirstAtxHeadingLine(markdown: string): string {
		const firstHeading = MarkdownDocumentParser.findFirstContentHeading(markdown);
		if (!firstHeading) return markdown;
		const lines = MarkdownDocumentParser.toLines(markdown);
		return [...lines.slice(0, firstHeading.lineIndex), ...lines.slice(firstHeading.lineIndex + 1)].join("\n");
	}

	static parseH1TitleFromFirstContentLine(markdown: string): string | undefined {
		return MarkdownDocumentParser.findFirstContentHeading(markdown, { onlyH1: true })?.title;
	}

	static assertResolvedUnderArticleDir(articleDir: Path, resolvedFile: Path): void {
		const base = articleDir.removeExtraSymbols.value;
		const target = resolvedFile.removeExtraSymbols.value;
		if (!target.startsWith(base.endsWith("/") ? base : `${base}/`) && target !== base) {
			throw new Error("Mermaid path resolves outside the article directory");
		}
	}

	static collectMermaidMatches(markdown: string): Array<{ start: number; end: number; relPath: string }> {
		const out: Array<{ start: number; end: number; relPath: string }> = [];
		MarkdownDocumentParser.MERMAID_PATH_TAG_RE.lastIndex = 0;
		let match = MarkdownDocumentParser.MERMAID_PATH_TAG_RE.exec(markdown);
		while (match !== null) {
			out.push({
				start: match.index,
				end: match.index + match[0].length,
				relPath: (match[2] ?? "").trim(),
			});
			match = MarkdownDocumentParser.MERMAID_PATH_TAG_RE.exec(markdown);
		}
		return out;
	}

	static async renderMermaidReplacement(
		relPath: string,
		articleDir: Path,
		readLinkedFile: (pathFromTag: string) => Promise<string>,
	): Promise<string> {
		if (!relPath) return "Empty path to mermaid diagram";
		const fullPath = articleDir.join(new Path(relPath));
		try {
			MarkdownDocumentParser.assertResolvedUnderArticleDir(articleDir, fullPath);
			let script = await readLinkedFile(relPath);
			script = script.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
			return `\`\`\`mermaid\n${script.trimEnd()}\n\`\`\``;
		} catch (e) {
			const msg = e instanceof Error ? e.message : String(e);
			return `Failed to read mermaid diagram: ${relPath}: ${msg}`;
		}
	}

	static async expandMermaidPathTagsInSource(
		markdown: string,
		articleDir: Path,
		readLinkedFile: (pathFromTag: string) => Promise<string>,
	): Promise<string> {
		if (!markdown.includes("<mermaid")) {
			return markdown;
		}
		const matches = MarkdownDocumentParser.collectMermaidMatches(markdown);
		if (!matches.length) return markdown;

		const parts: string[] = [];
		let lastIndex = 0;
		for (const match of matches) {
			parts.push(markdown.slice(lastIndex, match.start));
			parts.push(
				await MarkdownDocumentParser.renderMermaidReplacement(match.relPath, articleDir, readLinkedFile),
			);
			lastIndex = match.end;
		}
		parts.push(markdown.slice(lastIndex));
		return parts.join("");
	}

	static slugify(text: string): string {
		return text
			.toLowerCase()
			.replace(/[`*_~]/g, "")
			.replace(/[^\p{L}\p{N}\s-]/gu, "")
			.trim()
			.replace(/\s+/g, "-");
	}

	static sectionLineEnd(
		raw: Array<{ level: number; lineStart: number }>,
		index: number,
		linesLength: number,
	): number {
		const lv = raw[index]!.level;
		for (let j = index + 1; j < raw.length; j++) {
			if (raw[j]!.level <= lv) {
				return raw[j]!.lineStart - 1;
			}
		}
		return linesLength;
	}

	static parseFlatHeadings(content: string): MarkdownHeading[] {
		const lines = MarkdownDocumentParser.toLines(content);
		const raw: Array<{ level: number; title: string; lineStart: number; id: string }> = [];
		const idSeen = new Map<string, number>();

		for (let i = 0; i < lines.length; i++) {
			const heading = MarkdownDocumentParser.parseAtxHeading(lines[i] ?? "");
			if (!heading) continue;
			const level = heading.level;
			const title = heading.title;
			const base = MarkdownDocumentParser.slugify(title) || `h-${i + 1}`;
			const n = (idSeen.get(base) ?? 0) + 1;
			idSeen.set(base, n);
			const id = n === 1 ? base : `${base}-${n}`;
			raw.push({ level, title, lineStart: i + 1, id });
		}

		return raw.map((h, i) => ({
			...h,
			lineEnd: MarkdownDocumentParser.sectionLineEnd(raw, i, lines.length),
			children: [],
		}));
	}

	static flatToHierarchy(flat: MarkdownHeading[]): MarkdownHeading[] {
		const roots: MarkdownHeading[] = [];
		const stack: MarkdownHeading[] = [];

		for (let i = 0; i < flat.length; i++) {
			const cur = flat[i]!;
			const node: MarkdownHeading = {
				id: cur.id,
				level: cur.level,
				title: cur.title,
				lineStart: cur.lineStart,
				lineEnd: cur.lineEnd,
				children: [],
			};

			while (stack.length && stack[stack.length - 1]!.level >= node.level) {
				stack.pop();
			}
			const parent = stack[stack.length - 1];
			if (parent) parent.children.push(node);
			else roots.push(node);
			stack.push(node);
		}

		return roots;
	}

	static applyLineRangeEditToSource(source: string, lineStart: number, lineEnd: number, content: string): string {
		const lines = MarkdownDocumentParser.toLines(source);
		const replacementLines = content.length === 0 ? [] : MarkdownDocumentParser.toLines(content);
		const range = MarkdownDocumentParser.validateRangeForEdit(lineStart, lineEnd, lines.length);
		return MarkdownDocumentParser.spliceLines(lines, range.startIndex, range.endIndexExclusive, replacementLines);
	}

	static validateRangeForEdit(
		lineStart: number,
		lineEnd: number,
		lineCount: number,
	): { startIndex: number; endIndexExclusive: number } {
		if (lineEnd === lineStart - 1) {
			if (lineStart < 1 || lineStart > lineCount + 1) {
				throw new Error(`Invalid insert position: lineStart=${lineStart} (file has ${lineCount} lines)`);
			}
			return { startIndex: lineStart - 1, endIndexExclusive: lineStart - 1 };
		}
		if (lineStart > lineEnd) {
			throw new Error(
				`Invalid range: lineStart (${lineStart}) > lineEnd (${lineEnd}) and not an insert (lineEnd must be lineStart - 1)`,
			);
		}
		if (lineStart < 1 || lineEnd > lineCount || lineStart > lineCount) {
			throw new Error(`Invalid replace range: ${lineStart}–${lineEnd} (file has ${lineCount} lines)`);
		}
		return { startIndex: lineStart - 1, endIndexExclusive: lineEnd };
	}

	static spliceLines(
		sourceLines: string[],
		startIndex: number,
		endIndexExclusive: number,
		replacementLines: string[],
	): string {
		return [...sourceLines.slice(0, startIndex), ...replacementLines, ...sourceLines.slice(endIndexExclusive)].join(
			"\n",
		);
	}
}

export function createParserForRead(
	item: { content?: string | null },
	propsTitle: string | undefined,
	markdown?: string,
): MarkdownDocumentParser {
	const source = markdown ?? item.content ?? "";
	const virtualMarkdown = MarkdownDocumentParser.buildVirtualArticleForRead(source, propsTitle);
	return MarkdownDocumentParser.fromRawMarkdown(virtualMarkdown);
}
