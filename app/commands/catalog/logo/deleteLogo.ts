import { Command } from "@app/types/Command";
import { ResponseKind } from "@app/types/ResponseKind";
import { DesktopModeMiddleware } from "@core/Api/middleware/DesktopModeMiddleware";
import Path from "@core/FileProvider/Path/Path";
import Theme from "@ext/Theme/Theme";

const deleteLogo: Command<{ catalogName: string; theme: Theme; content: string }, void> = Command.create({
	path: "catalog/logo/delete",
	kind: ResponseKind.none,
	middlewares: [new DesktopModeMiddleware()],

	async do({ catalogName, theme }) {
		const workspace = this._app.wm.current();
		const catalog = await workspace.getBaseCatalog(catalogName);
		if (!catalog) return;

		const logoPath = Theme[theme] === Theme.light ? catalog.props.logo : catalog.props[`logo_${theme}`];
		if (!logoPath) return;

		const path = catalog.getRootCategoryDirectoryPath().join(new Path(logoPath));

		await workspace.getFileProvider().delete(path);
	},

	params(ctx, q, body) {
		const catalogName = q.catalogName;
		const theme = q.theme as Theme;
		return { ctx, catalogName, theme, content: body };
	},
});

export default deleteLogo;
