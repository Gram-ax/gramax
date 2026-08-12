import { Command } from "@app/types/Command";
import { ResponseKind } from "@app/types/ResponseKind";
import type Context from "@core/Context/Context";
import Path from "@core/FileProvider/Path/Path";
import { pullLfsResourceIfPointer } from "@core/GitLfs/logic/pullLfsResourceIfPointer";
import HashResourceByPathManager from "@core/Hash/HashItems/HashResourceByPathManager";
import MimeTypes from "@core-ui/ApiServices/Types/MimeTypes";
import { addEvent, Level } from "@ext/loggers/opentelemetry";

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
		const { rp, wm } = this._app;
		const workspace = wm.current();

		const mime = mimeType ?? MimeTypes?.[fullResourcePath.extension] ?? `application/${fullResourcePath.extension}`;
		const catalog = await workspace.getCatalog(catalogName, ctx);
		if (!catalog) {
			addEvent("no-catalog", Level.Internal, { catalogName });
			return;
		}

		const fp = workspace.getFileStructure().fp;

		// This read path bypasses ResourceManager, so the lazy LFS loader never fires — pull the pointer
		// ourselves before HashResourceByPathManager reads the real content.
		await pullLfsResourceIfPointer({ fp, catalog, absolutePath: catalog.basePath.join(fullResourcePath), ctx, rp });

		const hashItem = new HashResourceByPathManager(fullResourcePath, fp, catalog.basePath);

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
