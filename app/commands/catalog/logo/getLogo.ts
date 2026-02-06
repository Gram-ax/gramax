import { Command } from "@app/types/Command";
import { ResponseKind } from "@app/types/ResponseKind";
import Path from "@core/FileProvider/Path/Path";
import { ItemRef } from "@core/FileStructue/Item/ItemRef";
import HashItemRef from "@core/Hash/HashItems/HashItemRef";
import MimeTypes from "@core-ui/ApiServices/Types/MimeTypes";
import Theme from "@ext/Theme/Theme";

const getLogo: Command<
	{ catalogName: string; theme: Theme; force?: boolean },
	{ hashItem: HashItemRef; mime: string }
> = Command.create({
	path: "catalog/logo",

	kind: ResponseKind.blob,

	async do({ catalogName, theme, force }) {
		const workspace = this._app.wm.current();
		const catalog = await workspace.getBaseCatalog(catalogName);
		if (!catalog) return;
		const themeLogo = force
			? catalog.props[`logo_${theme}`]
			: (catalog.props[`logo_${theme}`] ?? catalog.props.logo);
		const logoPath = Theme[theme] === Theme.light ? catalog.props.logo : themeLogo;
		if (!logoPath) return;

		const path = catalog.getRootCategoryDirectoryPath().join(new Path(logoPath));
		const itemRef: ItemRef = { path, storageId: catalog.getRootCategoryRef().storageId };

		if (!(await workspace.getFileProvider().exists(itemRef.path))) return;

		const hashItem: HashItemRef = new HashItemRef(itemRef, workspace);
		return { hashItem, mime: MimeTypes[path.extension] ?? path.extension };
	},

	params(ctx, q) {
		const catalogName = q.catalogName;
		const theme = q.theme as Theme;
		const force = Boolean(q.force);
		return { ctx, catalogName, theme, force };
	},
});

export default getLogo;
