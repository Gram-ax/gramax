import { Command } from "@app/types/Command";
import { ResponseKind } from "@app/types/ResponseKind";
import Context from "@core/Context/Context";
import Path from "@core/FileProvider/Path/Path";
import HashResourceByPathManager from "@core/Hash/HashItems/HashResourceByPathManager";
import MimeTypes from "@core-ui/ApiServices/Types/MimeTypes";
import assert from "assert";

const get: Command<
	{
		fullResourcePath: Path;
		ctx: Context;
		catalogName: string;
		mimeType: MimeTypes;
	},
	{ mime: MimeTypes; hashItem: HashResourceByPathManager }
> = Command.create({
	path: "article/resource/getByPath",

	kind: ResponseKind.blob,

	async do({ fullResourcePath, mimeType, catalogName, ctx }) {
		const { wm } = this._app;
		const workspace = wm.current();

		const mime = mimeType ?? MimeTypes?.[fullResourcePath.extension] ?? `application/${fullResourcePath.extension}`;
		const catalog = await workspace.getCatalog(catalogName, ctx);
		assert(catalog);

		const hashItem = new HashResourceByPathManager(
			fullResourcePath,
			workspace.getFileStructure().fp,
			catalog.basePath,
		);

		return { hashItem, mime };
	},

	params(ctx, q) {
		const fullResourcePath = new Path(q.fullResourcePath);
		const mimeType = q.mimeType as MimeTypes;
		const catalogName = q.catalogName;
		return { ctx, fullResourcePath, mimeType, catalogName };
	},
});

export default get;
