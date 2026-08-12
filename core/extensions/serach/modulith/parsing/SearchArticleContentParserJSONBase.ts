import { isDebugLoggingEnabled } from "@ext/loggers/isDebugLoggingEnabled";
import type { JSONContent } from "@tiptap/core";

export interface SearchArticleContentParserJSONBaseOptions {
	items: JSONContent[];
	getFragmentItems: (id: string) => Promise<JSONContent[] | undefined>;
	getPropertyValue: (id: string) => string | undefined;
	readResource?: (src: string) => Promise<string | undefined>;
}

export abstract class SearchArticleContentParserJSONBase<
	TOptions extends SearchArticleContentParserJSONBaseOptions = SearchArticleContentParserJSONBaseOptions,
> {
	constructor(protected readonly _options: TOptions) {}

	protected abstract _handleHeading(title: string, level?: number): void;
	protected abstract _addText(text: string): void;
	protected abstract _handleNote(note: JSONContent): Promise<void>;
	protected abstract _handleTab(tab: JSONContent): Promise<void>;
	protected abstract _handleTable(item: JSONContent): Promise<void>;
	protected abstract _handleDiagrams(item: JSONContent): Promise<void>;
	protected abstract _handleDrawio(item: JSONContent): Promise<void>;
	protected abstract _handleBlockMd(item: JSONContent): Promise<void>;

	protected async _handleParagraph(item: JSONContent): Promise<void> {
		const text = item.content?.map((x) => this._getText(x)).join("");
		if (text) {
			this._addText(text);
		}
	}

	protected async _handleFragment(fragment: JSONContent): Promise<void> {
		if (!fragment.attrs?.id) return;

		const items = await this._options.getFragmentItems(fragment.attrs.id);
		await this._parseItems(items);
	}

	protected _jsonToString(json: JSONContent): string {
		return json.content?.map((x) => this._getText(x)).join("") ?? "";
	}

	protected _getText(item: JSONContent) {
		return item.type === "inline-property" && item.attrs.bind
			? (this._options.getPropertyValue(item.attrs.bind) ?? item.text)
			: item.text;
	}

	protected async _resolveDiagramDefinition(node: JSONContent): Promise<string> {
		const inline = typeof node.attrs?.content === "string" ? node.attrs.content.trim() : "";
		if (inline) return inline;

		const src = node.attrs?.src;
		if (typeof src !== "string" || !src.trim() || !this._options.readResource) return "";

		const fromFile = await this._options.readResource(src);
		return (fromFile ?? "").trim();
	}

	protected async _parseItems(items?: JSONContent[]): Promise<void> {
		if (!items) return;

		for (const item of items) {
			try {
				await this._parseItem(item);
			} catch (error) {
				if (isDebugLoggingEnabled()) {
					const message = error instanceof Error ? error.message : String(error);
					console.debug(`Error in SearchArticleContentParserJSONBase._parseItem: ${message}`, item);
				}
			}
		}
	}

	private async _parseItem(item: JSONContent): Promise<void> {
		if (!item) return;

		switch (item.type) {
			case "paragraph": {
				await this._handleParagraph(item);
				break;
			}
			case "heading":
				this._handleHeading(this._jsonToString(item), item.attrs.level);
				break;
			case "code_block":
				this._addText(this._jsonToString(item));
				break;
			case "table":
				await this._handleTable(item);
				break;
			case "note":
				await this._handleNote(item);
				break;
			case "bulletList":
			case "orderedList":
				await this._parseItems(item.content?.flatMap((x) => x.content));
				break;
			case "tab":
				await this._handleTab(item);
				break;
			case "fragment":
				await this._handleFragment(item);
				break;
			case "diagrams":
				await this._handleDiagrams(item);
				break;
			case "drawio":
				await this._handleDrawio(item);
				break;
			case "blockMd":
				await this._handleBlockMd(item);
				break;
			case "horizontal_rule":
			case "openapi":
			case "image":
			case "video":
			case "view":
			case "html":
				break;
			default:
				await this._parseItems(item.content);
				break;
		}
	}
}
