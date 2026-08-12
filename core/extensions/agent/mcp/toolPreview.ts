import type Application from "@app/types/Application";
import type Context from "@core/Context/Context";
import Path from "@core/FileProvider/Path/Path";

export type ToolPreview = { itemTitle?: string };

export async function buildToolPreview(
	args: unknown,
	app: Application,
	ctx: Context,
): Promise<ToolPreview | undefined> {
	const { catalogName, itemPath, fromItemPath } = (args ?? {}) as {
		catalogName?: string;
		itemPath?: string;
		fromItemPath?: string;
	};
	const path = itemPath ?? fromItemPath;
	if (!catalogName || !path) return undefined;

	try {
		const item = (await app.wm.current().getCatalog(catalogName, ctx)).findItemByItemPath(
			new Path(Path.join(catalogName, path)),
		);
		const itemTitle = item?.getTitle();
		return itemTitle ? { itemTitle } : undefined;
	} catch {
		return undefined;
	}
}
