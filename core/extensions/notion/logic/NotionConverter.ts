import fileNameUtils from "@core-ui/fileNameUtils";
import { transliterate } from "@core-ui/languageConverter/transliterate";
import FileProvider from "@core/FileProvider/model/FileProvider";
import Path from "@core/FileProvider/Path/Path";
import t from "@ext/localization/locale/translate";
import NotionAPI from "@ext/notion/api/NotionAPI";
import getNotionConvertors from "@ext/notion/logic/getNotionConverters";
import contentTypeToExtension from "@ext/notion/logic/getNotionExtension";
import { PageNode, PathsMapValue } from "@ext/notion/model/NotionTypes";
import NotionNodeConverter from "@ext/notion/model/NotionNodeConverter";
import NotionSourceData from "@ext/notion/model/NotionSourceData";
import { JSONContent } from "@tiptap/core";
import convertNotionUnsupportedNode from "@ext/notion/logic/convertNotionUnsupportedNode";

export default class NotionConverter {
	private _page: PageNode;
	private _allFileNames: string[];
	private _articlePath: Path;
	private _pathsMap: Map<string, PathsMapValue>;
	private _conversionMap: Record<string, NotionNodeConverter> = getNotionConvertors();

	constructor(private _data: NotionSourceData, private _fp: FileProvider) {}

	convert(page: PageNode, articlePath: Path, pathsMap: Map<string, PathsMapValue>): Promise<JSONContent> {
		this._allFileNames = [];
		this._page = page;
		this._articlePath = articlePath;
		this._pathsMap = pathsMap;

		return this._convertNotionToGramax({ type: "doc", content: page.content });
	}

	private async _convertNotionToGramax(notionJSON: JSONContent): Promise<JSONContent> {
		const gramaxJSON = this._convertNotionNodeToGramaxNode(notionJSON);
		if (!gramaxJSON) return;
		if (gramaxJSON.content) {
			const newContent = [];
			for (const node of gramaxJSON.content) {
				const newNode = await this._convertNotionToGramax(node);
				if (newNode) newContent.push(newNode);
			}
			gramaxJSON.content = newContent;
		}
		return gramaxJSON;
	}

	private _convertNotionNodeToGramaxNode(notionNode: JSONContent): JSONContent {
		const convert = this._conversionMap[notionNode?.type];

		return convert
			? convert(notionNode, {
					save: this._saveAttachment.bind(this),
					convertUnsupported: (node) => convertNotionUnsupportedNode(node, this._page.url),
					currentPath: this._articlePath,
					pathsMap: this._pathsMap,
			  })
			: convertNotionUnsupportedNode(notionNode, this._page.url);
	}

	private async _saveAttachment(fileLink: string) {
		try {
			const api = new NotionAPI(this._data);
			const { blob, contentType } = await api.downloadAttachment(fileLink);
			const extension = contentTypeToExtension(contentType);

			if (!extension) {
				throw new Error(`${t("import.error.ext-not-supported")} ${fileLink}`);
			}

			const title = transliterate(this._page.title, { kebab: true, maxLength: 50 });

			const newName = fileNameUtils.getNewName(this._allFileNames, title, extension);
			this._allFileNames.push(newName);
			const filePath = this._articlePath.parentDirectoryPath.join(new Path(newName));

			await this._fp.write(filePath, Buffer.from(await blob.arrayBuffer()));
			return { newName, title: decodeURIComponent(new URL(fileLink).pathname.split("/").pop() || title) };
		} catch (error) {
			console.error(error);
		}
	}
}
