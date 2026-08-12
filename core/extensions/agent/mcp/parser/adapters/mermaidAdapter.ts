import { UNIQUE_NAME_SEPARATOR } from "@app/config/const";
import Path from "@core/FileProvider/Path/Path";
import { uniqueName } from "@core/utils/uniqueName";
import MimeTypes from "@core-ui/ApiServices/Types/MimeTypes";
import assert from "assert";
import { CatalogItemLookup } from "../../utils/catalogPaths";
import { MarkdownDocumentParser } from "../markdownParser";
import type { ArticleAdapter, ArticleAdapterContext } from "./adapter";

const MERMAID_STORAGE_TAG_RE = /<mermaid\s+([^>]+)\s*\/>/gi;
const MERMAID_AGENT_BLOCK_RE = /<mermaid(\s[^>]*)?>([\s\S]*?)<\/mermaid>/gi;
const MERMAID_EXTENSION = ".mermaid";

export class MermaidAdapter implements ArticleAdapter {
	async expandToAgentView(storageMarkdown: string, context: ArticleAdapterContext): Promise<string> {
		if (!storageMarkdown.includes("<mermaid")) return storageMarkdown;

		const articleRef = new Path(context.item.ref.path.value);
		const articleDir = articleRef.parentDirectoryPath;
		const articlePath = articleRef.value;

		return MermaidAdapter._replaceTags(storageMarkdown, MERMAID_STORAGE_TAG_RE, async (match) => {
			const attrs = MarkdownDocumentParser.parseXmlAttrs(match[1] ?? "");
			const relPath = attrs.path?.trim() ?? "";
			assert(relPath, "Empty path to mermaid diagram");
			CatalogItemLookup.assertResolvedUnderPath(articleDir, articleDir.join(new Path(relPath)));
			const body = MermaidAdapter.normalizeBody(await this._readLinkedFile(context, articlePath, relPath));
			return MermaidAdapter._formatAgentBlock(attrs, body);
		});
	}

	async applyAgentViewToStorage(agentMarkdown: string, context: ArticleAdapterContext): Promise<string> {
		const articleRef = new Path(context.item.ref.path.value);
		const articleDir = articleRef.parentDirectoryPath;
		const articleBaseName = articleRef.nameWithExtension;
		const articlePath = articleRef.value;

		return MermaidAdapter._replaceTags(agentMarkdown, MERMAID_AGENT_BLOCK_RE, async (match) => {
			const attrs = MarkdownDocumentParser.parseXmlAttrs(match[1] ?? "");
			const rawCaptured = match[2] ?? "";
			const body = MermaidAdapter.normalizeBody(rawCaptured);
			const path = await this._resolveDiagramPath(context, articleDir, articleBaseName, attrs, body);

			await this._writeLinkedFile(context, articlePath, path, body);
			return MermaidAdapter._formatStorageTag({ ...attrs, path });
		});
	}

	static normalizeBody(script: string): string {
		const unified = script.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
		const withBreaks = unified.replace(/(?<!\\)\\n/g, "<br>");
		const lines = withBreaks.split("\n");
		while (lines.length && lines[0]!.trim() === "") {
			lines.shift();
		}
		return lines.join("\n").trimEnd();
	}

	private static async _replaceTags(
		source: string,
		pattern: RegExp,
		replace: (match: RegExpExecArray) => Promise<string>,
	): Promise<string> {
		const parts: string[] = [];
		let lastIndex = 0;
		pattern.lastIndex = 0;
		let match = pattern.exec(source);
		while (match !== null) {
			parts.push(source.slice(lastIndex, match.index));
			parts.push(await replace(match));
			lastIndex = match.index + match[0].length;
			match = pattern.exec(source);
		}
		parts.push(source.slice(lastIndex));
		return parts.join("");
	}

	private static _formatTagAttrs(attrs: Record<string, string>): string {
		return Object.entries(attrs)
			.map(([key, value]) => ` ${key}="${value}"`)
			.join("");
	}

	private static _formatStorageTag(attrs: Record<string, string>): string {
		assert(attrs.path, "Mermaid diagram requires path attribute");
		return `<mermaid${MermaidAdapter._formatTagAttrs(attrs)} />`;
	}

	private static _formatAgentBlock(attrs: Record<string, string>, body: string): string {
		return `<mermaid${MermaidAdapter._formatTagAttrs(attrs)}>\n${body}\n</mermaid>`;
	}

	private async _readLinkedFile(
		context: ArticleAdapterContext,
		articlePath: string,
		pathFromTag: string,
	): Promise<string> {
		const getCmd = context.commands.article.resource.get;
		const args = getCmd.params(
			context.ctx,
			{
				src: pathFromTag,
				articlePath,
				catalogName: context.catalog.name,
				mimeType: MimeTypes.text,
			},
			undefined,
		);
		const res = (await getCmd.do(args)) as { hashItem?: { getContent: () => Promise<string> } } | undefined;
		assert(res?.hashItem, "Resource not found");
		return (await res.hashItem.getContent()) ?? "";
	}

	private async _writeLinkedFile(
		context: ArticleAdapterContext,
		articlePath: string,
		path: string,
		content: string,
	): Promise<string> {
		const setCmd = context.commands.article.resource.set;
		const args = setCmd.params(
			context.ctx,
			{ src: path, articlePath, catalogName: context.catalog.name, force: "true" },
			{ data: Buffer.from(content, "utf-8") },
		);
		const res = (await setCmd.do(args)) as { path?: string } | undefined;
		return res?.path ?? path;
	}

	private async _listResourceNames(context: ArticleAdapterContext, articleDir: Path): Promise<string[]> {
		const items = await context.app.wm.current().getFileProvider().getItems(articleDir);
		return items.map((i) => `./${i.name}`);
	}

	private async _allocateDiagramPath(
		context: ArticleAdapterContext,
		articleDir: Path,
		articleBaseName: string,
	): Promise<string> {
		const names = await this._listResourceNames(context, articleDir);
		const base = articleBaseName.replace(/\.md$/i, "") || "diagram";
		return uniqueName(`./${base}`, names, MERMAID_EXTENSION, UNIQUE_NAME_SEPARATOR, true);
	}

	private async _resolveDiagramPath(
		context: ArticleAdapterContext,
		articleDir: Path,
		articleBaseName: string,
		attrs: Record<string, string>,
		body: string,
	): Promise<string> {
		const relPath = attrs.path?.trim();
		if (relPath) {
			CatalogItemLookup.assertResolvedUnderPath(articleDir, articleDir.join(new Path(relPath)));
			assert(body.trim(), "Diagram block is empty");
			return relPath;
		}
		assert(body.trim(), "Diagram block is empty and has no path");
		const newPath = await this._allocateDiagramPath(context, articleDir, articleBaseName);
		CatalogItemLookup.assertResolvedUnderPath(articleDir, articleDir.join(new Path(newPath)));
		return newPath;
	}
}
