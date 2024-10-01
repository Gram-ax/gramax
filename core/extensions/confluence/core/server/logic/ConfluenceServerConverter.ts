import FileProvider from "@core/FileProvider/model/FileProvider";
import Path from "@core/FileProvider/Path/Path";

import ConfluenceServerSourceData from "@ext/confluence/core/server/model/ConfluenceServerSourceData.schema";
import generateConfluenceArticleLink from "@ext/confluence/core/logic/generateConfluenceArticleLink";
import { ConfluenceArticle } from "@ext/confluence/core/model/ConfluenceArticle";
import { JSONContent } from "@tiptap/core";
import ConfluenceConverter from "@ext/confluence/core/model/ConfluenceConverter";
import convertHTMLUnsupportedNode from "@ext/confluence/core/server/logic/convertHTMLUnsupportedNode";
import getServerConvertors from "@ext/confluence/core/server/logic/getServerConvertors";
import HTMLNodeConverter from "@ext/confluence/core/server/model/HTMLNodeConverter";
import { makeSourceApi } from "@ext/git/actions/Source/makeSourceApi";
import ConfluenceServerAPI from "@ext/confluence/core/api/ConfluenceServerAPI";
import getConfluenceExtension from "@ext/confluence/core/api/getConfluenceExtension";
import assertMaxFileSize from "@core/Resource/assertMaxFileSize";
import fileNameUtils from "@core-ui/fileNameUtils";
import t from "@ext/localization/locale/translate";

export default class ConfluenceServerConverter implements ConfluenceConverter {
	private _confluencePageUrl: string;
	private _articleId: string;
	private _articlePath: Path;
	private _allFileNames: string[];
	private _conversionMap: Record<string, HTMLNodeConverter>;

	constructor(private _data: ConfluenceServerSourceData, private _fp: FileProvider) {
		this._conversionMap = getServerConvertors();
	}

	async convert(article: ConfluenceArticle, articlePath: Path): Promise<JSONContent> {
		this._allFileNames = [];
		this._confluencePageUrl = generateConfluenceArticleLink(article, false);
		const parser = new DOMParser();
		const doc = parser.parseFromString(confFixBadHTML(article.content), "text/html");
		this._articleId = article.id;
		this._articlePath = articlePath;

		return this._convertConfluenceToGramax(doc.body);
	}

	private async _convertConfluenceToGramax(node: HTMLElement): Promise<JSONContent> {
		const gramaxNode = await this._convertConfluenceNodeToGramaxNode(node);

		if (!gramaxNode) return;
		const childNodes = Array.from(node.childNodes) as HTMLElement[];
		if (childNodes.length > 0) {
			const newContent = [];
			for (const child of childNodes) {
				const newNode = await this._convertConfluenceToGramax(child);
				if (newNode) newContent.push(newNode);
			}
			if (!gramaxNode?.content) gramaxNode.content = newContent;
		}
		return gramaxNode;
	}

	private async _convertConfluenceNodeToGramaxNode(htmlNode: HTMLElement): Promise<JSONContent> {
		if (htmlNode.nodeType === Node.TEXT_NODE && !htmlNode.textContent?.trim()) {
			return Promise.resolve(null);
		}

		let tagName = htmlNode?.tagName?.toLowerCase() ?? "text";

		if (tagName === "ac:structured-macro") tagName = htmlNode.getAttribute("ac:name");

		const convert: HTMLNodeConverter = this._conversionMap[tagName];

		return convert
			? await convert(htmlNode, {
					save: this._saveAttachment.bind(this),
					confluencePageUrl: this._confluencePageUrl,
					data: this._data,
			  })
			: convertHTMLUnsupportedNode(htmlNode, this._confluencePageUrl);
	}

	private async _saveAttachment(fileName: string, articleId = this._articleId) {
		try {
			const api = makeSourceApi(this._data) as ConfluenceServerAPI;
			const attachment = await api.getAttachmentData(fileName, articleId);

			if (!attachment) throw new Error(`${t("confluence.error.couldnt-find-file")}: ${fileName}`);

			assertMaxFileSize(attachment.fileSize);

			const { fileNameWithoutExtension, extension } = getConfluenceExtension(attachment.title);

			if (!extension)
				throw new Error(
					`${t("confluence.error.ext-not-supported")} ${(attachment.title, attachment.mediaType)}`,
				);

			const blob = await api.downloadAttachment(attachment.downloadLink);
			const newName = fileNameUtils.getNewName(this._allFileNames, fileNameWithoutExtension, extension);
			this._allFileNames.push(newName);
			const filePath = this._articlePath.parentDirectoryPath.join(new Path(newName));

			await this._fp.write(filePath, Buffer.from(await blob.arrayBuffer()));
			return { newName, title: attachment.title };
		} catch (error) {
			console.log(error);
		}
	}
}

export const confFixBadHTML = (content: string): string => {
	const emoticonRegex = /<ac:emoticon[^>]*ac:emoji-id="([^"]+)"[^>]*\/>/g;
	return content.replace(emoticonRegex, (match, emojiId) => {
		return `<emoji id="${emojiId}"></emoji>`;
	});
};
