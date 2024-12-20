import fileNameUtils from "@core-ui/fileNameUtils";
import Path from "@core/FileProvider/Path/Path";
import FileProvider from "@core/FileProvider/model/FileProvider";
import assertMaxFileSize from "@core/Resource/assertMaxFileSize";
import getCloudConvertors from "@ext/confluence/core/cloud/logic/getCloudConvertors";
import CONFLUENCE_EXTENSION_TYPES from "@ext/confluence/core/cloud/model/confluenceExtensionTypes";
import generateConfluenceArticleLink from "@ext/confluence/core/logic/generateConfluenceArticleLink";
import { ConfluenceArticle } from "@ext/confluence/core/model/ConfluenceArticle";
import t from "@ext/localization/locale/translate";
import { JSONContent } from "@tiptap/core";
import NodeConverter from "../model/NodeConverter";
import getConfluenceExtension from "../../api/getConfluenceExtension";
import ConfluenceConverter from "@ext/confluence/core/model/ConfluenceConverter";
import ConfluenceCloudSourceData from "@ext/confluence/core/cloud/model/ConfluenceCloudSourceData";
import ConfluenceAttachment from "@ext/confluence/core/api/model/ConfluenceAttachment";
import convertUnsupportedNode from "@ext/confluence/core/cloud/logic/convertUnsupportedNode";
import ConfluenceCloudAPI from "@ext/confluence/core/api/ConfluenceCloudAPI";

export default class ConfluenceCloudConverter implements ConfluenceConverter {
	private _confluencePageUrl: string;
	private _pageAttachments: ConfluenceAttachment[];
	private _allFileNames: string[];
	private _articlePath: Path;
	private _conversionMap: Record<string, NodeConverter>;

	constructor(private _data: ConfluenceCloudSourceData, private _fp: FileProvider) {
		this._conversionMap = getCloudConvertors();
	}

	convert(article: ConfluenceArticle, articlePath: Path): Promise<JSONContent> {
		this._allFileNames = [];
		this._pageAttachments = [];
		this._articlePath = articlePath;
		this._confluencePageUrl = generateConfluenceArticleLink(article);
		return this._convertConfluenceToGramax(JSON.parse(article.content));
	}

	private async _convertConfluenceToGramax(confluenceJSON: JSONContent): Promise<JSONContent> {
		const gramaxJSON = await this._convertConfluenceNodeToGramaxNode(confluenceJSON);
		if (!gramaxJSON) return;
		if (gramaxJSON.content) {
			const newContent = [];
			for (const node of gramaxJSON.content) {
				const newNode = await this._convertConfluenceToGramax(node);
				if (newNode) newContent.push(newNode);
			}
			gramaxJSON.content = newContent;
		}
		return gramaxJSON;
	}

	private async _convertConfluenceNodeToGramaxNode(confluenceNode: JSONContent): Promise<JSONContent> {
		const convert: NodeConverter = CONFLUENCE_EXTENSION_TYPES.includes(confluenceNode?.type)
			? this._conversionMap[confluenceNode?.attrs?.extensionKey]
			: this._conversionMap[confluenceNode?.type];

		return convert
			? await convert(confluenceNode, {
					save: this._saveAttachment.bind(this),
					confluencePageUrl: this._confluencePageUrl,
					data: this._data,
			  })
			: convertUnsupportedNode(confluenceNode, this._confluencePageUrl);
	}

	private async _saveAttachment(fileId: string, articleId: string, isExternal = false) {
		try {
			const api = new ConfluenceCloudAPI(this._data);

			if (isExternal || this._pageAttachments.length === 0) {
				const newAttachments = await api.getPageAttachments(articleId);
				this._pageAttachments.push(...newAttachments);
			}

			const foundAttachment = this._pageAttachments.find((attachment) => attachment.fileId == fileId);

			if (!foundAttachment) throw new Error(`${t("confluence.error.couldnt-find-fileId")} ${fileId}`);

			const { fileNameWithoutExtension, extension } = getConfluenceExtension(foundAttachment.title);

			if (!extension) {
				throw new Error(
					`${t("import.error.ext-not-supported")} ${(foundAttachment.title, foundAttachment.mediaType)}`,
				);
			}

			assertMaxFileSize(foundAttachment.fileSize);

			const downloadLink = `ex/confluence/${this._data.cloudId}/wiki/rest/api/content/${articleId}/child/attachment/${foundAttachment.id}/download`;
			const blob = await api.downloadAttachment(downloadLink);

			const newName = fileNameUtils.getNewName(this._allFileNames, fileNameWithoutExtension, extension);
			this._allFileNames.push(newName);
			const filePath = this._articlePath.parentDirectoryPath.join(new Path(newName));

			await this._fp.write(filePath, Buffer.from(await blob.arrayBuffer()));
			return { newName, title: foundAttachment.title };
		} catch (error) {
			console.error(error);
		}
	}
}
