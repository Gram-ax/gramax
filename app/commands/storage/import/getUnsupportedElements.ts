import { Command } from "@app/types/Command";
import { ResponseKind } from "@app/types/ResponseKind";
import { NetworkConnectMiddleWare } from "@core/Api/middleware/NetworkConntectMiddleware";
import Path from "@core/FileProvider/Path/Path";
import getConfluenceUnsupportedElements from "@ext/confluence/core/logic/getConfluenceUnsupportedElements";
import ConfluenceStorage from "@ext/confluence/core/logic/ConfluenceStorage";
import ConfluenceStorageData from "@ext/confluence/core/model/ConfluenceStorageData";
import UnsupportedElements from "@ext/import/model/UnsupportedElements";
import StorageData from "@ext/storage/models/StorageData";
import SourceType from "@ext/storage/logic/SourceDataProvider/model/SourceType";
import NotionStorage from "@ext/notion/logic/NotionStorage";
import NotionAPI from "@ext/notion/api/NotionAPI";
import NotionSourceData from "@ext/notion/model/NotionSourceData";
import getNotionUnsupportedElements from "@ext/notion/logic/getNotionUnsupportedElements";

const getUnsupportedElements: Command<
	{ storageDataName: Path; sourceType: SourceType; data: StorageData },
	UnsupportedElements[]
> = Command.create({
	path: "storage/import/getUnsupportedElements",
	kind: ResponseKind.json,

	middlewares: [new NetworkConnectMiddleWare()],

	async do({ storageDataName, sourceType, data }) {
		const workspace = this._app.wm.current();
		const fp = workspace.getFileProvider();

		if (await fp?.exists(storageDataName)) return;

		if (sourceType === SourceType.notion) {
			const pageTree = await NotionStorage.getNotionPageTree(new NotionAPI(data.source as NotionSourceData));
			return getNotionUnsupportedElements(pageTree);
		}

		if (sourceType === SourceType.confluenceCloud || sourceType === SourceType.confluenceServer) {
			const blogs = await ConfluenceStorage.getConfluenceBlogs(data as ConfluenceStorageData);
			const articles = await ConfluenceStorage.getConfluenceArticlesTree(data as ConfluenceStorageData);
			return getConfluenceUnsupportedElements(blogs, articles, data.source.sourceType);
		}
	},

	params(_, q, body) {
		return { storageDataName: new Path(q.storageDataName), sourceType: q.sourceType as SourceType, data: body };
	},
});

export default getUnsupportedElements;
