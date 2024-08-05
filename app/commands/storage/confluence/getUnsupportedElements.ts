import { Command } from "@app/types/Command";
import { ResponseKind } from "@app/types/ResponseKind";
import { NetworkConnectMiddleWare } from "@core/Api/middleware/NetworkConntectMiddleware";
import Path from "@core/FileProvider/Path/Path";
import getConfluenceUnsupportedElements from "@ext/confluence/actions/Import/logic/getConfluenceUnsupportedElements";
import UnsupportedElements from "@ext/confluence/actions/Import/model/UnsupportedElements";
import ConfluenceStorage from "@ext/confluence/core/logic/ConfluenceStorage";
import ConfluenceStorageData from "@ext/confluence/core/model/ConfluenceStorageData";

const getUnsupportedElements: Command<{ storageDataName: Path; data: ConfluenceStorageData }, UnsupportedElements[]> =
	Command.create({
		path: "storage/confluence/getUnsupportedElements",
		kind: ResponseKind.json,

		middlewares: [new NetworkConnectMiddleWare()],

		async do({ storageDataName, data }) {
			const workspace = this._app.wm.current();
			const fp = workspace.getFileProvider();
			if (await fp?.exists(storageDataName)) return;

			const blogs = await ConfluenceStorage.getConfluenceBlogs(data);
			const articles = await ConfluenceStorage.getConfluenceArticlesTree(data);
			return getConfluenceUnsupportedElements(blogs, articles);
		},

		params(_, q, body) {
			return { storageDataName: new Path(q.storageDataName), data: body };
		},
	});

export default getUnsupportedElements;
