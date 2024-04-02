import { Document, ISectionOptions, PageBreak, Paragraph } from "docx";
import { FileChild } from "docx/build/file/file-child";
import FileProvider from "../../logic/FileProvider/model/FileProvider";
import ParserContext from "../markdown/core/Parser/ParserContext/ParserContext";
import { wordDocumentStyles } from "./wordDocumentStyles";
import { WordSerializerState } from "./WordExportState";
import { Article } from "./WordTypes";
import { getBlockChilds } from "./getBlockChilds";
import { getInlineChilds } from "./getInlineChilds";
import { createTitleParagraph } from "@ext/wordExport/TextWordGenerator";

class WordExport {
	constructor(private _fileProvider: FileProvider, private _parserContext: ParserContext) {}

	async getDocumentFromArticle(article: Article) {
		return await this._getDocument([article]);
	}

	async getDocumentFromArticles(articles: Article[]) {
		return await this._getDocument(articles, true);
	}

	private async _getDocument(articles: Article[], pageBreak?: boolean) {
		const sections = (await this._getDocumentSections(articles, pageBreak)).filter((val) => val);
		
		return new Document({ sections, ...wordDocumentStyles });
	}

	private _getDocumentSections(articles: Article[], pageBreak?: boolean): Promise<ISectionOptions[]> {
		const margin = { top: 567, bottom: 567, right: 1049, left: 1049 };
		const properties = { page: { margin } };

		try {
			return Promise.all(
				articles.map(async (article, i) => ({
					properties,
					children: [
						...(await this._parseArticle(article)),
						...(pageBreak && i + 1 < articles.length
							? [new Paragraph({ children: [new PageBreak()] })]
							: []),
					],
				})),
			);
		} catch {
			return;
		}
	}

	private async _parseArticle(article: Article): Promise<FileChild[]> {
		if (!article.content || typeof article.content === "string") return;

		const wordSerializerState = new WordSerializerState(
			getInlineChilds(),
			getBlockChilds(),
			article.resourceManager,
			this._fileProvider,
			this._parserContext,
		);

		const content = [];
		for (const child of article.content.children) {
			if (child && typeof child !== "string") {
				const renderedBlock = await wordSerializerState.renderBlock(child);
				if (renderedBlock) content.push(...[].concat(renderedBlock));
			}
		}

		return [createTitleParagraph(article.title, 1), ...content];
	}
}

export default WordExport;
