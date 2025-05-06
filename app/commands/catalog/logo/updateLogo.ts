import { Command } from "@app/types/Command";
import { ResponseKind } from "@app/types/ResponseKind";
import { DesktopModeMiddleware } from "@core/Api/middleware/DesktopModeMiddleware";
import Path from "@core/FileProvider/Path/Path";

const updateLogo: Command<{ catalogName: string; name: string; content: string }, void> = Command.create({
	path: "catalog/logo/update",
	kind: ResponseKind.none,
	middlewares: [new DesktopModeMiddleware()],

	async do({ catalogName, name, content }) {
		const workspace = this._app.wm.current();
		const catalog = await workspace.getBaseCatalog(catalogName);
		if (!catalog) return;

		const path = catalog.getRootCategoryDirectoryPath().join(new Path(name));

		const cleanedBase64 = content.replace(/^data:image\/[^;]+;base64,/, "");
		const svgBuffer = Buffer.from(cleanedBase64, "base64");

		await workspace.getFileProvider().write(path, svgBuffer);
	},

	params(ctx, q, body) {
		const catalogName = q.catalogName;
		const name = q.name;
		return { ctx, catalogName, name: name, content: body };
	},
});

export default updateLogo;
