import DiagramType from "@core/components/Diagram/DiagramType";
import Path from "@core/FileProvider/Path/Path";
import { requestPlantUmlDiagram } from "@ext/markdown/elements/diagrams/diagrams/plantUml/requestPlantUmlDiagram";
import { extractTextsMermaid } from "@ext/serach/modulith/parsing/extractTextsMermaid";
import { extractTextsSvg } from "@ext/serach/modulith/parsing/extractTextsSvg";
import SearchArticleContentParserBase from "@ext/serach/modulith/parsing/SearchArticleContentParserBase";
import type { ArticleItem, ArticleTableRow, ArticleTableRowData } from "@ics/gx-vector-search";
import type { JSONContent } from "@tiptap/core";
import { SemVer } from "semver";

const REMOTE_VERSION_0_0_7 = new SemVer("0.0.7");

export interface SearchArticleContentParserOptions {
	items: JSONContent[];
	getSnippetItems: (id: string) => Promise<JSONContent[] | undefined>;
	getPropertyValue: (id: string) => string | undefined;
	getLinkId: (fileName: Path) => string | undefined;
	readResource?: (src: string) => Promise<string | undefined>;
	diagramRendererServerUrl?: string;
	remoteVersion?: SemVer;
}

export default class SearchArticleContentParser extends SearchArticleContentParserBase {
	constructor(private readonly _options: SearchArticleContentParserOptions) {
		super();
	}

	async parse(): Promise<ArticleItem[]> {
		await this._parseItems(this._options.items);
		return this._children;
	}

	private async _parseItems(items?: JSONContent[]): Promise<void> {
		if (!items) return;

		for (const item of items) {
			try {
				await this._parseItem(item);
			} catch (error) {
				console.error("Error parsing item: ", error);
			}
		}
	}

	private async _parseItem(item: JSONContent): Promise<void> {
		if (!item) return;

		switch (item.type) {
			case "paragraph": {
				const buffer = [];

				item.content?.forEach((x) => {
					if (x.type === "text" && x.marks?.length > 0) {
						const filePath = x.marks.find((y) => y.type === "file")?.attrs.resourcePath;
						if (filePath != undefined) {
							this._addText(buffer.join(""));
							buffer.length = 0;

							const fileName = new Path(filePath);
							const link = this._options.getLinkId(fileName);
							if (link != undefined) {
								this._addItem({
									type: "embedded-link",
									title: x.text ?? "",
									link,
								});

								return;
							}
						}
					}

					const text = this._getText(x);
					buffer.push(text);
				});

				if (buffer.length > 0) {
					this._addText(buffer.join(""));
				}
				break;
			}
			case "heading":
				this._addHeader(item.attrs.level, this._jsonToString(item));
				break;
			case "code_block":
				this._addText(this._jsonToString(item));
				break;
			case "table":
				await this._addTable(item);
				break;
			case "note":
				await this._addNote(item);
				break;
			case "bulletList":
			case "orderedList":
				await this._parseItems(item.content?.flatMap((x) => x.content));
				break;
			case "tab":
				await this._addTab(item);
				break;
			case "snippet":
				await this._addSnippet(item);
				break;
			case "diagrams": {
				if (item.attrs?.diagramName === DiagramType.mermaid) {
					await this._addDiagramTexts(item, (definition) => extractTextsMermaid(definition));
				}
				if (item.attrs?.diagramName === DiagramType["plant-uml"]) {
					await this._addDiagramTexts(item, async (definition) => {
						const svgContent = await plantUmlToSvg(definition, this._options.diagramRendererServerUrl);
						return extractTextsSvg(svgContent);
					});
				}
				break;
			}
			case "drawio": {
				// Drawio diagrams are not indexed for remote search for now
				if (this._options.remoteVersion) break;

				await this._addDiagramTexts(item, (definition) => extractTextsSvg(definition));
				break;
			}
			case "horizontal_rule":
			case "openapi":
			case "blockMd":
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

	private async _addNote(note: JSONContent): Promise<void> {
		this._enterBlock({
			type: "block",
			items: [],
			title: note.attrs.title,
		});

		await this._parseItems(note.content);
		this._exitBlock();
	}

	private async _addTab(tab: JSONContent): Promise<void> {
		this._enterBlock({
			type: "block",
			items: [],
			title: tab.attrs?.name,
		});

		await this._parseItems(tab.content);
		this._exitBlock();
	}

	private async _addSnippet(snippet: JSONContent): Promise<void> {
		if (!snippet.attrs?.id) return;

		const items = await this._options.getSnippetItems(snippet.attrs.id);
		await this._parseItems(items);
	}

	private async _addTable(table: JSONContent): Promise<void> {
		const rows: ArticleTableRow[] = [];
		for (const row of table.content ?? []) {
			const data: ArticleTableRowData[] = [];
			for (const cell of row.content ?? []) {
				let cellItems: ArticleItem[] = [];
				if (cell.content) {
					cellItems = await new SearchArticleContentParser({
						...this._options,
						items: cell.content,
					}).parse();
				}

				data.push({
					items: cellItems,
					colspan: cell.attrs.colspan,
					rowspan: cell.attrs.rowspan,
				});
			}

			rows.push({
				data,
			});
		}

		this._addItem({
			type: "table",
			rows,
		});
	}

	private _jsonToString(json: JSONContent): string {
		return json.content?.map((x) => this._getText(x)).join("") ?? "";
	}

	private _getText(item: JSONContent) {
		return item.type === "inline-property" && item.attrs.bind
			? (this._options.getPropertyValue(item.attrs.bind) ?? item.text)
			: item.text;
	}

	private async _addDiagramTexts(
		item: JSONContent,
		resolveDisplayTexts: (definition: string) => Promise<string[]>,
	): Promise<void> {
		const definition = await resolveDiagramDefinition(item, this._options.readResource);
		const title = item.attrs?.title != null ? String(item.attrs.title).trim() : "";

		if (!this._options.remoteVersion) {
			if (title) this._addText(title);
			if (!definition) return;
			const displayTexts = await resolveDisplayTexts(definition);
			for (const text of displayTexts) {
				this._addText(text);
			}
			return;
		}

		if (this._options.remoteVersion.compare(REMOTE_VERSION_0_0_7) < 0) {
			if (title) this._addText(title);
			if (!definition) return;
			this._addText(definition);
			return;
		}

		if (!definition) return;
		this._addItem({
			type: "diagram",
			diagramType: item.attrs?.diagramName,
			title,
			items: [
				{
					type: "text",
					text: definition,
				},
			],
		});
	}
}

async function resolveDiagramDefinition(
	node: JSONContent,
	readDiagramFile: (src: string) => Promise<string | undefined>,
): Promise<string> {
	const inline = typeof node.attrs?.content === "string" ? node.attrs.content.trim() : "";
	if (inline) return inline;

	const src = node.attrs?.src;
	if (typeof src !== "string" || !src.trim()) return "";

	const fromFile = await readDiagramFile(src);
	return (fromFile ?? "").trim();
}

async function plantUmlToSvg(diagramContent: string, diagramRendererUrl?: string) {
	if (!diagramRendererUrl) throw new Error("Diagram renderer URL is not set");
	const diagramResponse = await requestPlantUmlDiagram(diagramContent, diagramRendererUrl);
	if (diagramResponse.ok) return diagramResponse.text();

	const errorText = await diagramResponse.text().catch(() => "");
	throw new Error(
		`Failed to convert PlantUML to SVG. Status: ${diagramResponse.status}.${errorText ? ` Response: ${errorText}` : ""}`,
	);
}
