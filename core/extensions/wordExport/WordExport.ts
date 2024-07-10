import useBareLocalize from "@ext/localization/useLocalize/useBareLocalize";
import { Tag } from "@ext/markdown/core/render/logic/Markdoc";
import DocumentTree from "@ext/wordExport/DocumentTree/DocumentTree";
import { createContent } from "@ext/wordExport/TextWordGenerator";
import { Document, ISectionOptions, TableOfContents } from "docx";
import { FileChild } from "docx/build/file/file-child";
import FileProvider from "../../logic/FileProvider/model/FileProvider";
import { WordSerializerState } from "./WordExportState";
import { getBlockChildren } from "./getBlockChildren";
import { getInlineChildren } from "./getInlineChildren";
import jsonXml from "./options/styles.json";
import { wordDocumentStyles } from "./options/wordDocumentStyles";
import { HeadingStyles, WordFontStyles } from "./options/wordExportSettings";
import { createParagraph } from "@ext/wordExport/createParagraph";
import { defaultLanguage } from "@ext/localization/core/model/Language";

class WordExport {
	constructor(private _fileProvider: FileProvider) {}

	async getDocument(documentTree: DocumentTree, isCategory: boolean) {
		const sections = await this._getDocumentSections(documentTree, isCategory);
		const externalStyles = jsonXml[0];

		return new Document({ sections, ...wordDocumentStyles, externalStyles });
	}

	private async _getDocumentSections(rootNode: DocumentTree, isCategory: boolean) {
		const sections: ISectionOptions[] = [];

		if (isCategory) sections.push({ children: this._createTableOfContents(rootNode) });

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

	private _createTableOfContents(article: DocumentTree): FileChild[] {
		return [
			createParagraph(
				[
					createContent(
						useBareLocalize("tableOfContents", article?.parserContext?.getLanguage() ?? defaultLanguage),
					),
				],
				WordFontStyles.tableOfContents,
			),
			new TableOfContents("tableOfContents", {
				hyperlink: true,
				headingStyleRange: "1-1",
			}),
		];
	}

	private async _parseArticle(article: DocumentTree) {
		if (!article.content || typeof article.content === "string") return [this._createTitle(article)];

		const state = new WordSerializerState(
			getInlineChildren(),
			getBlockChildren(),
			article.resourceManager,
			this._fileProvider,
			article.parserContext,
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

	private _createTitle = (article: DocumentTree) => {
		return createParagraph(
			[createContent(article.level ? article.number + " " + article.name : article.name)],
			HeadingStyles[+!!article.level],
		);
	};
}

export default WordExport;
