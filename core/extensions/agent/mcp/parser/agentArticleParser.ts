import type { CommandTree } from "@app/commands";
import type Application from "@app/types/Application";
import type Context from "@core/Context/Context";
import type { Article } from "@core/FileStructue/Article/Article";
import type ContextualCatalog from "@core/FileStructue/Catalog/ContextualCatalog";
import type { Category } from "@core/FileStructue/Category/Category";
import assert from "assert";
import type { ArticleAdapter, ArticleAdapterContext } from "./adapters/adapter";
import { MermaidAdapter } from "./adapters/mermaidAdapter";
import { PropsAdapter } from "./adapters/propsAdapter";
import { MarkdownDocumentParser, type MarkdownHeading } from "./markdownParser";

export class AgentArticleParser {
	private static readonly _adapters: ArticleAdapter[] = [new MermaidAdapter(), new PropsAdapter()];

	private constructor(
		private readonly _storageBody: string,
		private readonly _context: ArticleAdapterContext,
	) {}

	static async open(
		app: Application,
		ctx: Context,
		commands: CommandTree,
		catalog: ContextualCatalog,
		item: Article | Category,
	): Promise<AgentArticleParser> {
		const context: ArticleAdapterContext = { app, ctx, commands, catalog, item };
		const storageBody = await item.getContent();
		return new AgentArticleParser(storageBody, context);
	}

	get storageBody(): string {
		return this._storageBody;
	}

	async getMarkdownForAgent(): Promise<string> {
		return AgentArticleParser._expandStorageToAgentView(this._storageBody, this._context);
	}

	async getHeadingHierarchy(): Promise<MarkdownHeading[]> {
		return MarkdownDocumentParser.getHeadingHierarchy(await this.getMarkdownForAgent());
	}

	async getMarkdownForHeading(headingId: string): Promise<string> {
		return MarkdownDocumentParser.getHeadingSectionMarkdown(await this.getMarkdownForAgent(), headingId);
	}

	async applyHeadingSectionEdit(headingId: string, content: string): Promise<string> {
		return MarkdownDocumentParser.applyHeadingSectionEdit(await this.getMarkdownForAgent(), headingId, content);
	}

	async applyChanges(agentMarkdown: string): Promise<string> {
		this._assertNoHtmlEntitiesInAgentMarkdown(agentMarkdown);
		return AgentArticleParser._applyAgentViewToStorage(agentMarkdown, this._context);
	}

	private _assertNoHtmlEntitiesInAgentMarkdown(agentMarkdown: string): void {
		if (!/[<>]/.test(this._storageBody)) return;
		assert(
			!agentMarkdown.includes("&lt;") && !agentMarkdown.includes("&gt;") && !agentMarkdown.includes("&amp;"),
			"content must not use HTML entities (&lt;, &gt;, &amp;) when the article uses literal angle brackets",
		);
	}

	private static async _expandStorageToAgentView(
		storageMarkdown: string,
		context: ArticleAdapterContext,
	): Promise<string> {
		let markdown = storageMarkdown;
		for (const adapter of AgentArticleParser._adapters) {
			markdown = await adapter.expandToAgentView(markdown, context);
		}
		return markdown;
	}

	private static async _applyAgentViewToStorage(
		agentMarkdown: string,
		context: ArticleAdapterContext,
	): Promise<string> {
		let markdown = agentMarkdown;
		for (const adapter of AgentArticleParser._adapters) {
			markdown = await adapter.applyAgentViewToStorage(markdown, context);
		}
		return markdown;
	}
}
