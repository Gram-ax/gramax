import { ItemFilter } from "@core/FileStructue/Catalog/Catalog";
import { CatalogProps } from "@core/FileStructue/Catalog/CatalogProps";
import ContextualCatalog from "@core/FileStructue/Catalog/ContextualCatalog";
import { resolveLanguage } from "@ext/localization/core/model/Language";
import t from "@ext/localization/locale/translate";
import { Tag } from "@ext/markdown/core/render/logic/Markdoc";
import DocumentTree from "@ext/wordExport/DocumentTree/DocumentTree";
import { ExportType } from "@ext/wordExport/ExportType";
import { createContent } from "@ext/wordExport/TextWordGenerator";
import { createParagraph } from "@ext/wordExport/createParagraph";
import { generateBookmarkName } from "@ext/wordExport/generateBookmarkName";
import { TitleInfo } from "@ext/wordExport/options/WordTypes";
import type { ISectionOptions, Paragraph } from "docx";
import docx from "@dynamicImports/docx";
import { WordSerializerState } from "./WordExportState";
import { getBlockChildren } from "./getBlockChildren";
import { getInlineChildren } from "./getInlineChildren";
import { getWordDocumentStyles } from "./options/wordDocumentStyles";
import { getHeadingStyles, WordFontStyles } from "./options/wordExportSettings";
import { styles } from "@ext/wordExport/options/mainStyles";

const MAX_HEADING_LEVEL = 9;

abstract class WordExport {
	constructor(
		private _exportType: ExportType,
		private readonly _titlesMap: Map<string, TitleInfo>,
		private _catalog: ContextualCatalog<CatalogProps>,
		private _itemsFilter: ItemFilter[],
	) {}

	async getDocument(documentTree: DocumentTree) {
		const { Document } = await docx();

		return new Document({
			sections: await this.getSections(documentTree),
			...(await getWordDocumentStyles()),
			externalStyles: styles,
		});
	}

	async getSections(documentTree: DocumentTree, skipFirstNode = false, combineIntoSingleSection = false) {
		return await this._getDocumentSections(documentTree, skipFirstNode, combineIntoSingleSection);
	}

	protected async _getDocumentSections(
		rootNode: DocumentTree,
		skipFirstNode = false,
		combineIntoSingleSection = false,
	) {
		const sections: ISectionOptions[] = [];
		const combinedChildren: Paragraph[] = [];

		const pushChildren = (children: Paragraph[]) => {
			if (!children.length) return;
			if (combineIntoSingleSection) {
				combinedChildren.push(...children);
			} else {
				sections.push({ children });
			}
		};

		if (this._exportType == ExportType.withTableOfContents)
			pushChildren((await this._createTableOfContents(rootNode)) as Paragraph[]);

		const processNode = async (currentNode: DocumentTree, content = [], skipFirstNode = false) => {
			if (!skipFirstNode) content.push(...(await this._parseArticle(currentNode)));

			const isEmptyArticle =
				(currentNode.content === "" || (currentNode.content as Tag).children.length < 1) &&
				currentNode.children.length > 0;

			if (isEmptyArticle) {
				await processNode(currentNode.children[0], content);
				currentNode.children.shift();
				for (const child of currentNode.children) await processNode(child);
				return;
			}

			if (content.length) pushChildren(content);

			if (!isEmptyArticle) for (const child of currentNode.children) await processNode(child);
		};

		await processNode(rootNode, [], skipFirstNode);

		if (combineIntoSingleSection && combinedChildren.length) {
			return [{ children: combinedChildren }];
		}

		return sections;
	}

	protected async _createTableOfContents(article: DocumentTree) {
		const { TableOfContents } = await docx();
		return [
			await createParagraph(
				[
					await createContent(
						t("word.table-of-contents", article?.parserContext?.getLanguage() ?? resolveLanguage()),
					),
				],
				WordFontStyles.tableOfContents,
			),
			new TableOfContents("tableOfContents", {
				hyperlink: true,
				headingStyleRange: "1-9",
			}),
		];
	}

	private async _parseArticle(article: DocumentTree) {
		if (!article.content || typeof article.content === "string") return [await this._createTitle(article)];
		const state = new WordSerializerState(
			getInlineChildren(),
			getBlockChildren(),
			article.parserContext,
			this._exportType,
			this._titlesMap,
			article.name,
			article.number,
			this._catalog,
			this._itemsFilter,
		);

		const contentPromises = article.content.children.map(async (child) => {
			if (child && typeof child !== "string") {
				const renderedBlock = await state.renderBlock(child);
				return renderedBlock ? [].concat(renderedBlock) : [];
			}
			return [];
		});

		const content = (await Promise.all(contentPromises)).flat();

		return [await this._createTitle(article), ...content];
	}

	protected abstract _createTitle(article: DocumentTree): Promise<Paragraph>;
}

export class MainWordExport extends WordExport {
	protected _createTitle = async (article: DocumentTree) => {
		const { BookmarkStart, BookmarkEnd } = await docx();
		const headingStyles = await getHeadingStyles();
		const bookmarkId = 1;
		const bookmarkName = generateBookmarkName(article.number, article.name);

		return await createParagraph(
			[
				new BookmarkStart(bookmarkName, bookmarkId),
				await createContent(article.name),
				new BookmarkEnd(bookmarkId),
			],
			headingStyles[article.level <= MAX_HEADING_LEVEL ? article.level : MAX_HEADING_LEVEL + 1],
		);
	};
}

export default WordExport;
