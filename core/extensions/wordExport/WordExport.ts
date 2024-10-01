import t from "@ext/localization/locale/translate";
import { Tag } from "@ext/markdown/core/render/logic/Markdoc";
import DocumentTree from "@ext/wordExport/DocumentTree/DocumentTree";
import { createContent } from "@ext/wordExport/TextWordGenerator";
import { Document, ISectionOptions, Paragraph, TableOfContents } from "docx";
import { WordSerializerState } from "./WordExportState";
import { getBlockChildren } from "./getBlockChildren";
import { getInlineChildren } from "./getInlineChildren";
import stylesJson from "./options/mainStyles.json";
import { wordDocumentStyles } from "./options/wordDocumentStyles";
import { HeadingStyles, WordFontStyles } from "./options/wordExportSettings";
import { createParagraph } from "@ext/wordExport/createParagraph";
import { defaultLanguage } from "@ext/localization/core/model/Language";
import { ExportType } from "@ext/wordExport/ExportType";

const MAX_HEADING_LEVEL = 9;

abstract class WordExport {
	constructor(private _exportType: ExportType, private readonly _domain) {}

	async getDocument(documentTree: DocumentTree) {
		const sections = await this._getDocumentSections(documentTree);
		const externalStyles = stylesJson[0];

		return new Document({ sections, ...wordDocumentStyles, externalStyles });
	}

	protected async _getDocumentSections(rootNode: DocumentTree) {
		const sections: ISectionOptions[] = [];

		if (this._exportType == ExportType.withTableOfContents)
			sections.push({ children: this._createTableOfContents(rootNode) });

		const processNode = async (currentNode: DocumentTree, content = []) => {
			content.push(...(await this._parseArticle(currentNode)));

			const isEmptyArticle =
				(currentNode.content === "" || (currentNode.content as Tag).children.length < 1) &&
				currentNode.children.length > 0;

			if (isEmptyArticle) {
				await processNode(currentNode.children[0], content);
				currentNode.children.shift();
				for (const child of currentNode.children) await processNode(child);
				return;
			}

			sections.push({ children: content });

			if (!isEmptyArticle) for (const child of currentNode.children) await processNode(child);
		};

		await processNode(rootNode);

		return sections;
	}

	protected _createTableOfContents(article: DocumentTree) {
		return [
			createParagraph(
				[createContent(t("word.table-of-contents", article?.parserContext?.getLanguage() ?? defaultLanguage))],
				WordFontStyles.tableOfContents,
			),
			new TableOfContents("tableOfContents", {
				hyperlink: true,
				headingStyleRange: "1-9",
			}),
		];
	}

	private async _parseArticle(article: DocumentTree) {
		if (!article.content || typeof article.content === "string") return [this._createTitle(article)];

		const state = new WordSerializerState(
			getInlineChildren(),
			getBlockChildren(),
			this._domain,
			article.parserContext,
			this._exportType,
		);

		const contentPromises = article.content.children.map(async (child) => {
			if (child && typeof child !== "string") {
				const renderedBlock = await state.renderBlock(child);
				return renderedBlock ? [].concat(renderedBlock) : [];
			}
			return [];
		});

		const content = (await Promise.all(contentPromises)).flat();

		return [this._createTitle(article), ...content];
	}

	protected abstract _createTitle(article: DocumentTree): Paragraph;
}

export class FallbackWordExport extends WordExport {
	protected _createTitle = (article: DocumentTree) =>
		createParagraph(
			[createContent(article.level ? article.number + " " + article.name : article.name)],
			HeadingStyles[+!!article.level],
		);
}

export class MainWordExport extends WordExport {
	protected _createTitle = (article: DocumentTree) =>
		createParagraph(
			[createContent(article.name)],
			HeadingStyles[article.level <= MAX_HEADING_LEVEL ? article.level : MAX_HEADING_LEVEL + 1],
		);
}

export default WordExport;
