import { Document, ISectionOptions, PageBreak, Paragraph, TextRun } from "docx";
import { FileChild } from "docx/build/file/file-child";
import FileProvider from "../../logic/FileProvider/model/FileProvider";
import ParserContext from "../markdown/core/Parser/ParserContext/ParserContext";
import { wordDocumentStyles } from "../markdown/elements/list/word/wordDocumentStyles";
import { WordSerializerState } from "./WordExportState";
import { Article } from "./WordTypes";
import { getBlockChilds } from "./getBlockChilds";
import { getInlineChilds } from "./getInlineChilds";
import { wordFontSizes } from "./wordExportSizes";

const convertMmToHeadingSpacing = 4;

export class WordExport {
	constructor(
		private _fileProvider: FileProvider,
		private _parserContext: ParserContext,
	) {}

	async getDocumentFromArticle(article: Article) {
		return await this._getDocument([article]);
	}

	async getDocumentFromArticles(articles: Article[]) {
		return await this._getDocument(articles, true);
	}

	private async _getDocument(articles: Article[], pageBreak?: boolean) {
		return new Document({
			sections: (await this._getDocumentSections(articles, pageBreak)).filter((val) => val),
			...wordDocumentStyles,
		});
	}

	private _getDocumentSections(articles: Article[], pageBreak?: boolean): Promise<ISectionOptions[]> {
		try {
			const documentSection = Promise.all(
				articles.map(async (article, i) => ({
					children: [
						...(await this._parseArticle(article)),
						...(pageBreak && i + 1 < articles.length
							? [new Paragraph({ children: [new PageBreak()] })]
							: []),
					],
				})),
			);

			return documentSection;
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

		return [
			new Paragraph({
				children: [new TextRun({ text: article.title, size: wordFontSizes.heading[1] })],
				spacing: {
					after: wordFontSizes.heading[1] * convertMmToHeadingSpacing,
				},
			}),
			...(
				await Promise.all(
					article.content.children
						.map((child) => {
							if (!child || typeof child === "string") return;
							return wordSerializerState.renderBlock(child);
						})
						.filter((child) => child)
						.flat(),
				)
			).flat(),
		];
	}
}
