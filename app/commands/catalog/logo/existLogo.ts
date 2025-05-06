import { Command } from "@app/types/Command";
import { ResponseKind } from "@app/types/ResponseKind";
import Path from "@core/FileProvider/Path/Path";
import Theme from "@ext/Theme/Theme";

const existLogo: Command<{ catalogName: string; theme: Theme }, { isExist?: boolean }> = Command.create({
	path: "catalog/logo/exist",

	kind: ResponseKind.json,

	async do({ catalogName, theme }) {
		const workspace = this._app.wm.current();
		const catalog = await workspace.getBaseCatalog(catalogName);
		if (!catalog) return;

		let isExist = false;

		const logoPath = Theme[theme] === Theme.light ? catalog.props.logo : catalog.props[`logo_${theme}`];
		if (logoPath) {
			const pathToLogo = catalog.getRootCategoryDirectoryPath().join(new Path(logoPath));
			isExist = await workspace.getFileProvider().exists(pathToLogo);
		}

		return { isExist };
	},

	params(ctx, q) {
		const catalogName = q.catalogName;
		const theme = q.theme as Theme;
		return { ctx, catalogName, theme };
	},
});

export default existLogo;
