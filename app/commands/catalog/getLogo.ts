import { ResponseKind } from "@app/types/ResponseKind";
import MimeTypes from "@core-ui/ApiServices/Types/MimeTypes";
import Path from "@core/FileProvider/Path/Path";
import { ItemRef } from "@core/FileStructue/Item/ItemRef";
import HashItemRef from "@core/Hash/HashItems/HashItemRef";
import Theme from "@ext/Theme/Theme";
import { Command } from "../../types/Command";

const getLogo: Command<{ catalogName: string; themeName: string }, { hashItem: HashItemRef; mime: string }> =
	Command.create({
		path: "catalog/logo",

		kind: ResponseKind.blob,

		async do({ catalogName, themeName: theme }) {
			const workspace = this._app.wm.current();
			const catalog = await workspace.getCatalogEntry(catalogName);
			if (!catalog) return;
			const logo =
				Theme[theme] == Theme.light
					? catalog.props["logo"]
					: catalog.props["logo_" + theme] ?? catalog.props["logo"];
			if (!logo) return;

			const path = catalog.getRootCategoryPath().join(new Path(logo));
			const itemRef: ItemRef = { path, storageId: catalog.getRootCategoryRef().storageId };

			if (!(await workspace.getFileProvider().exists(itemRef.path))) return;

			const hashItem: HashItemRef = new HashItemRef(itemRef, workspace);
			return { hashItem, mime: MimeTypes[path.extension] ?? path.extension };
		},

		params(ctx, q) {
			const catalogName = q.catalogName;
			const themeName = q.theme;
			return { ctx, catalogName, themeName };
		},
	});

export default getLogo;
