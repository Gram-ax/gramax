import type { ItemFilter } from "@core/FileStructue/Catalog/Catalog";
import type { CatalogProps } from "@core/FileStructue/Catalog/CatalogProps";
import type ContextualCatalog from "@core/FileStructue/Catalog/ContextualCatalog";
import type LinkResourceManager from "@core/Link/LinkResourceManager";
import type ResourceManager from "@core/Resource/ResourceManager";
import docx from "@dynamicImports/docx";
import type UiLanguage from "@ext/localization/core/model/Language";
import type ParserContext from "@ext/markdown/core/Parser/ParserContext/ParserContext";
import { createParagraph } from "@ext/wordExport/createParagraph";
import type { ExportType } from "@ext/wordExport/ExportType";
import { NON_BREAKING_SPACE } from "@ext/wordExport/options/wordExportSettings";
import { createContent } from "@ext/wordExport/TextWordGenerator";
import type { FileChild } from "@ext/wordExport/types";
import type { JSONContent } from "@tiptap/core";
import type { ParagraphChild } from "docx";
import type { Tag } from "../markdown/core/render/logic/Markdoc";
import type { AddOptionsWord, TitleInfo, WordBlockChildren, WordInlineChildren } from "./options/WordTypes";
import { normalizeInlineWhitespace } from "./utils/normalizeInlineWhitespace";

export class WordSerializerState {
	constructor(
		private _inlineConfig: WordInlineChildren,
		private _blockConfig: WordBlockChildren,
		private _parserContext: ParserContext,
		private _resourceManager: ResourceManager,
		private _linkResourceManager: LinkResourceManager,
		private _language: UiLanguage,
		private _exportType: ExportType,
		private readonly _titlesMap: Map<string, TitleInfo>,
		private readonly _articleName: string,
		private readonly _order: string,
		private _catalog: ContextualCatalog<CatalogProps>,
		private _itemsFilter: ItemFilter[],
	) {}

	async renderInline(parent: Tag | JSONContent, addOptions?: AddOptionsWord): Promise<ParagraphChild[]> {
		const children = "children" in parent ? parent.children : parent.content;
		const paragraphChild = await Promise.all(
			children.map(async (child) => {
				if (!child) return;

				if (typeof child === "string") {
					if (addOptions?.removeWhiteSpace && !child.trim()) return;

					let text = addOptions?.removeWhiteSpace ? normalizeInlineWhitespace(child) : child;

					if (addOptions?.code) text = NON_BREAKING_SPACE + text + NON_BREAKING_SPACE;
					return await createContent(text, addOptions);
				}

				const name = "name" in child ? child.name : child.type;
				return this._inlineConfig[name]?.({
					state: this,
					tag: child,
					addOptions,
					wordRenderContext: {
						parserContext: this._parserContext,
						resourceManager: this._resourceManager,
						linkResourceManager: this._linkResourceManager,
						language: this._language,
						exportType: this._exportType,
						titlesMap: this._titlesMap,
						articleName: this._articleName,
						order: this._order,
						catalog: this._catalog,
						itemsFilter: this._itemsFilter,
					},
				});
			}),
		);

		return paragraphChild.flat().filter((val) => val);
	}

	async renderBlockAsInline(tag: Tag | JSONContent) {
		const { TextRun } = await docx();
		const children = "children" in tag ? tag.children : tag.content;
		return (
			await Promise.all(
				children.map(async (child, i) => {
					if (!child) return;
					if (typeof child === "string") return new TextRun(child);

					return [
						(await this.renderInline(child)).flat().filter((val) => val),
						...(children.length > 1 && children.length > i + 1 ? [new TextRun({ break: 1 })] : []),
					];
				}),
			)
		)
			.filter((val) => val)
			.flat(2);
	}

	async renderBlock(block: Tag | JSONContent, addOptions?: AddOptionsWord): Promise<FileChild[]> {
		const name = "name" in block ? block.name : block.type;
		if (!this._blockConfig[name] && this._inlineConfig[name])
			return [await createParagraph(await this.renderInline({ children: [block] } as Tag))];

		return this._blockConfig[name]?.({
			state: this,
			tag: block,
			addOptions,
			wordRenderContext: {
				parserContext: this._parserContext,
				exportType: this._exportType,
				resourceManager: this._resourceManager,
				linkResourceManager: this._linkResourceManager,
				language: this._language,
				titlesMap: this._titlesMap,
				articleName: this._articleName,
				order: this._order,
				catalog: this._catalog,
				itemsFilter: this._itemsFilter,
			},
		});
	}
}
