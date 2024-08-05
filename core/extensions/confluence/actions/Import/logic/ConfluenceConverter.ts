import fileNameUtils from "@core-ui/fileNameUtils";
import Path from "@core/FileProvider/Path/Path";
import FileProvider from "@core/FileProvider/model/FileProvider";
import assertMaxFileSize from "@core/Resource/assertMaxFileSize";
import convertUnsupportedNode from "@ext/confluence/actions/Import/logic/convertUnsupportedNode";
import getConvertors from "@ext/confluence/actions/Import/logic/getConvertors";
import ConfluenceAttachment, {
	ConfluenceAttachmentResponse,
} from "@ext/confluence/actions/Import/model/ConfluenceAttachment";
import CONFLUENCE_EXTENSION_TYPES from "@ext/confluence/actions/Import/model/confluenceExtensionTypes";
import generateConfluenceArticleLink from "@ext/confluence/core/logic/generateConfluenceArticleLink";
import { ConfluenceArticle } from "@ext/confluence/core/model/ConfluenceArticle";
import ConfluenceStorageData from "@ext/confluence/core/model/ConfluenceStorageData";
import t from "@ext/localization/locale/translate";
import { JSONContent } from "@tiptap/core";
import NodeConverter from "./NodeConverter";
import confluenceMimeToExtension from "./confluenceMimeToExtension";

export default class ConfluenceConverter {
	private _confluencePageUrl: string;
	private _pageAttachments: ConfluenceAttachment[];
	private _allFileNames: string[];
	private _conversionMap: Record<string, NodeConverter>;

	constructor(private _data: ConfluenceStorageData, private _fp: FileProvider) {
		this._conversionMap = getConvertors();
	}

	convert(article: ConfluenceArticle, articlePath: Path): Promise<JSONContent> {
		this._allFileNames = [];
		this._pageAttachments = [];
		this._confluencePageUrl = generateConfluenceArticleLink(article);
		return this._convertConfluenceToGramax(article.content, articlePath);
	}

	private async _convertConfluenceToGramax(confluenceJSON: JSONContent, articlePath: Path): Promise<JSONContent> {
		const gramaxJSON = await this._convertConfluenceNodeToGramaxNode(confluenceJSON, articlePath);
		if (!gramaxJSON) return;
		if (gramaxJSON.content) {
			const newContent = [];
			for (const node of gramaxJSON.content) {
				const newNode = await this._convertConfluenceToGramax(node, articlePath);
				if (newNode) newContent.push(newNode);
			}
			gramaxJSON.content = newContent;
		}
		return gramaxJSON;
	}

	private async _convertConfluenceNodeToGramaxNode(
		confluenceNode: JSONContent,
		articlePath: Path,
	): Promise<JSONContent> {
		const convert: NodeConverter = CONFLUENCE_EXTENSION_TYPES.includes(confluenceNode?.type)
			? this._conversionMap[confluenceNode?.attrs?.extensionKey]
			: this._conversionMap[confluenceNode?.type];

		return convert
			? await convert(confluenceNode, {
					articlePath,
					save: this._saveAttachment.bind(this),
					confluencePageUrl: this._confluencePageUrl,
					data: this._data.source,
			  })
			: convertUnsupportedNode(confluenceNode, this._confluencePageUrl);
	}

	private async _saveAttachment(articlePath: Path, fileId: string, articleId: string, isExternal = false) {
		try {
			const attachments = await this._getConfluenceAttachments(articleId, isExternal);
			const foundAttachment = attachments.find((attachment) => attachment.fileId == fileId);

			const extension = confluenceMimeToExtension(foundAttachment);

			if (!extension) throw new Error(`${t("confluence.error.ext-not-supported")} ${foundAttachment.mediaType}`);
			assertMaxFileSize(foundAttachment.fileSize);
			const downloadUrl = `https://api.atlassian.com/ex/confluence/${this._data.source.cloudId}/wiki/rest/api/content/${articleId}/child/attachment/${foundAttachment.id}/download`;
			const downloadResponse = await fetch(downloadUrl, {
				headers: {
					Authorization: `Bearer ${this._data.source.token}`,
				},
			});
			if (!downloadResponse.ok) throw new Error(`${t("confluence.error.http-2")} ${downloadResponse.status}`);

			const blob = await downloadResponse.blob();
			const filenameWithoutExtension = foundAttachment.title.substring(0, foundAttachment.title.lastIndexOf("."));
			const newName = fileNameUtils.getNewName(this._allFileNames, filenameWithoutExtension, extension);
			this._allFileNames.push(newName);
			const filePath = articlePath.parentDirectoryPath.join(new Path(newName));

			await this._fp.write(filePath, Buffer.from(await blob.arrayBuffer()));
			return { newName, title: foundAttachment.title };
		} catch (error) {
			return null;
		}
	}

	private async _getConfluenceAttachments(articleId: string, isExternal: boolean) {
		if (!isExternal && this._pageAttachments.length) return this._pageAttachments;
		let url = `https://api.atlassian.com/ex/confluence/${this._data.source.cloudId}/wiki/api/v2/pages/${articleId}/attachments`;
		let attemptWithBlogposts = false;

		while (url) {
			const res = await fetch(url, {
				headers: {
					Authorization: `Bearer ${this._data.source.token}`,
				},
			});

			if (res.status === 404 && !attemptWithBlogposts) {
				url = `https://api.atlassian.com/ex/confluence/${this._data.source.cloudId}/wiki/api/v2/blogposts/${articleId}/attachments`;
				attemptWithBlogposts = true;
				continue;
			}

			if (!res.ok) throw new Error(`${t("confluence.error.http")}: ${res.status}`);

			const json: ConfluenceAttachmentResponse = await res.json();
			this._pageAttachments.push(...json.results);

			url = json._links.next
				? `https://api.atlassian.com/ex/confluence/${this._data.source.cloudId}${json._links.next}`
				: null;
		}

		return this._pageAttachments;
	}
}
