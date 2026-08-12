import DiagramType from "@core/components/Diagram/DiagramType";
import Path from "@core/FileProvider/Path/Path";
import { extractTextsMermaid } from "@ext/serach/modulith/parsing/extractTextsMermaid";
import { extractTextsSvg } from "@ext/serach/modulith/parsing/extractTextsSvg";
import { plantUmlToSvg } from "@ext/serach/modulith/parsing/plantUmlToSvg";
import {
	SearchArticleContentParserJSONBase,
	type SearchArticleContentParserJSONBaseOptions,
} from "@ext/serach/modulith/parsing/SearchArticleContentParserJSONBase";
import type {
	ArticleLanguage,
	SearchArticleItemMetadata,
	SearchArticleItems,
} from "@ext/serach/modulith/SearchArticle";
import { getLocalizedString } from "@ext/serach/modulith/utils/getLocalizedString";
import type { Table } from "@ext/tableDB/table";
import type { ArticleId } from "@ics/article-search/article";
import { ArticleItemCollector } from "@ics/article-search/article";
import type { JSONContent } from "@tiptap/core";

export interface SearchArticleContentParserOptions extends SearchArticleContentParserJSONBaseOptions {
	articleId: ArticleId;
	title: string;
	diagramRendererServerUrl?: string;
	getDbDiagramTexts?: (src: string, tags: string, primary: string) => Promise<string[] | undefined>;
	getLinkId: (fileName: Path) => string | undefined;
	lang: ArticleLanguage;
}

export default class SearchArticleContentParser extends SearchArticleContentParserJSONBase<SearchArticleContentParserOptions> {
	private readonly _collector: ArticleItemCollector<SearchArticleItemMetadata>;

	constructor(options: SearchArticleContentParserOptions) {
		super(options);
		this._collector = new ArticleItemCollector(options.articleId, options.title);
	}

	async parse(): Promise<SearchArticleItems> {
		await this._parseItems(this._options.items);
		return this._collector.finish();
	}

	protected _addText(text: string): void {
		if (!text?.length) return;
		this._collector.addText(text);
	}

	protected _handleHeading(title: string, level?: number): void {
		this._collector.enterHeading(title ?? "", level ?? this._collector.curLevel() + 1);
	}

	protected async _handleNote(note: JSONContent): Promise<void> {
		this._collector.enterBlock(note.attrs?.title ?? "");
		await this._parseItems(note.content);
		this._collector.exitBlock();
	}

	protected async _handleTab(tab: JSONContent): Promise<void> {
		this._collector.enterBlock(tab.attrs?.title ?? "");
		await this._parseItems(tab.content);
		this._collector.exitBlock();
	}

	protected async _handleTable(table: JSONContent): Promise<void> {
		for (const row of table.content ?? []) {
			for (const cell of row.content ?? []) {
				if (cell.content) {
					await this._parseItems(cell.content);
				}
			}
		}
	}

	protected async _handleParagraph(item: JSONContent): Promise<void> {
		const buffer = [];

		item.content?.forEach((x) => {
			if (x.type === "text" && x.marks?.length > 0) {
				const filePath = x.marks.find((y) => y.type === "file")?.attrs.resourcePath;
				if (filePath != null) {
					this._addText(buffer.join(""));
					buffer.length = 0;

					const fileName = new Path(filePath);
					const link = this._options.getLinkId(fileName);
					if (link != null) {
						this._collector.addEmbLink(x.text ?? "", link);
						return;
					}
				}
			}

			buffer.push(this._getText(x));
		});

		if (buffer.length > 0) this._addText(buffer.join(""));
	}

	protected async _handleDiagrams(item: JSONContent): Promise<void> {
		if (item.attrs?.diagramName === DiagramType.mermaid) {
			await this._addDiagramTexts(item, item.attrs.diagramName, (def) => extractTextsMermaid(def));
		}
		if (item.attrs?.diagramName === DiagramType["plant-uml"]) {
			await this._addDiagramTexts(item, item.attrs.diagramName, async (def) => {
				const svg = await plantUmlToSvg(def, this._options.diagramRendererServerUrl);
				return extractTextsSvg(svg);
			});
		}
	}

	protected async _handleDrawio(item: JSONContent): Promise<void> {
		await this._addDiagramTexts(item, "drawio", (def) => extractTextsSvg(def));
	}

	protected async _handleBlockMd(item: JSONContent): Promise<void> {
		const tag = item.attrs?.tag?.[0];
		if (!tag) return;

		if (tag.name === "Db-diagram") {
			await this._addDbDiagram(tag.attributes);
		} else if (tag.name === "Db-table") {
			this._addDbTable(tag.attributes?.object as Table);
		}
	}

	private _addDbTable(object: Table): void {
		if (!object) return;
		this._addText(object.code);
		const title = object.title ? getLocalizedString(object.title, this._options.lang) : null;
		if (title) this._addText(title);
		const description = object.description ? getLocalizedString(object.description, this._options.lang) : null;
		if (description) this._addText(description);

		object.fields.forEach((x) => {
			this._addText(x.code);
			this._addText(x.sqlType);
			const fieldTitle = x.title ? getLocalizedString(x.title, this._options.lang) : null;
			const fieldDescription = x.description ? getLocalizedString(x.description, this._options.lang) : null;
			const combined = `${fieldTitle ?? ""} ${fieldDescription ?? ""}`.trim();
			if (combined) this._addText(combined);
		});
	}

	private async _addDiagramTexts(
		item: JSONContent,
		diagramType: string,
		resolveDisplayTexts: (definition: string) => Promise<string[]>,
	): Promise<void> {
		const definition = await this._resolveDiagramDefinition(item);
		const title = item.attrs?.title != null ? String(item.attrs.title).trim() : "";
		const displayTexts = definition ? await resolveDisplayTexts(definition) : [];

		this._addDiagram(title, diagramType, displayTexts);
	}

	private async _addDbDiagram(attributes: Record<string, string>): Promise<void> {
		const src = attributes?.src;
		if (!src || !this._options.getDbDiagramTexts) return;
		const texts = await this._options.getDbDiagramTexts(src, attributes?.tags ?? "", attributes?.primary ?? "");
		if (!texts) return;
		this._addDiagram("", "Db-diagram", texts);
	}

	private _addDiagram(title: string, diagramType: string, texts: string[]) {
		this._collector.enterBlock(title, { type: "diagram", diagramType });
		texts.forEach((x) => {
			this._addText(x);
		});
		this._collector.exitBlock();
	}
}
