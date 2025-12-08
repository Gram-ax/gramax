import { CatalogMoveConflictResolution } from "@app/commands/catalog/move";
import { CATEGORY_ROOT_FILENAME } from "@app/config/const";
import { Command } from "@app/types/Command";
import { ResponseKind } from "@app/types/ResponseKind";
import { AuthorizeMiddleware } from "@core/Api/middleware/AuthorizeMiddleware";
import { DesktopModeMiddleware } from "@core/Api/middleware/DesktopModeMiddleware";
import ReloadConfirmMiddleware from "@core/Api/middleware/ReloadConfirmMiddleware";
import type Context from "@core/Context/Context";
import Path from "@core/FileProvider/Path/Path";
import type { Article } from "@core/FileStructue/Article/Article";
import ArticleParser from "@core/FileStructue/Article/ArticleParser";
import type { Category } from "@core/FileStructue/Category/Category";
import { ItemType } from "@core/FileStructue/Item/ItemType";
import type { WorkspacePath } from "@ext/workspace/WorkspaceConfig";
import assert from "assert";

export interface MoveProps {
	ctx: Context;
	setName?: string;
	setTitle?: string;
	articlePath: Path;
	sourceCatalogName: string;
	targetWorkspacePath: WorkspacePath;
	targetCatalogName: string;
	resolution?: CatalogMoveConflictResolution;
}

const move: Command<MoveProps, { redirectTo: string }> = Command.create({
	path: "article/move",

	kind: ResponseKind.json,

	middlewares: [new AuthorizeMiddleware(), new DesktopModeMiddleware(), new ReloadConfirmMiddleware()],

	async do({
		ctx,
		setName,
		setTitle,
		articlePath,
		targetWorkspacePath,
		targetCatalogName,
		sourceCatalogName,
		resolution,
	}: MoveProps) {
		const { wm, resourceUpdaterFactory } = this._app;

		const current = wm.current();
		assert(current.path() == targetWorkspacePath, "not supported");

		assert(setName, "setName is required");

		const sourceCatalog = await current.getCatalog(sourceCatalogName, ctx);
		assert(sourceCatalog, `catalog not found: ${sourceCatalogName}`);
		assert(
			!(sourceCatalog.props.supportedLanguages?.length > 1),
			"You can not move article out of catalog with multiple languages",
		);

		const targetCatalog = await current.getCatalog(targetCatalogName, ctx);
		assert(targetCatalog, `catalog not found: ${targetCatalogName}`);

		const sourceItem = sourceCatalog.findItemByItemPath(articlePath);
		assert(sourceItem, `source article of catalog ${sourceCatalog.name} not found: ${articlePath.value}`);

		const targetRootCategory = targetCatalog.getRootCategory();

		const maybeTargetItem = targetRootCategory.items.find((item) => {
			return item.getFileName() === setName || item.getTitle() === setTitle;
		});

		const hasConflict = !!maybeTargetItem;

		if (hasConflict) {
			if (resolution === "replace") {
				assert(maybeTargetItem, "target item not found for replace");
				const { parser, parserContextFactory } = this._app;
				const articleParser = new ArticleParser(ctx, parser, parserContextFactory);
				await targetCatalog.deleteItem(maybeTargetItem.ref, articleParser);
			}

			if (resolution === "keepBoth") {
				assert(
					!maybeTargetItem,
					`article with name ${setName} or title ${setTitle} already exists in target catalog ${targetCatalogName}. This is an error and another name should have been picked before calling this command with 'keepBoth'`,
				);
			}
		}

		let sourceCategory: Category;

		if (sourceItem.type === ItemType.article) {
			sourceCategory = await sourceCatalog.createCategoryByArticle(resourceUpdaterFactory, sourceItem as Article);
		} else {
			sourceCategory = sourceItem as Category;
		}

		await sourceCatalog.updateItemProps(
			{
				logicPath: sourceItem.logicPath,
				title: setTitle,
			},
			resourceUpdaterFactory,
		);

		const to = targetCatalog.getRootCategoryPath().join(new Path(setName));
		await current.getFileProvider().move(sourceCategory.ref.path.parentDirectoryPath, to);

		await targetCatalog.deref.update();
		const targetCatalogUpdated = await current.getContextlessCatalog(targetCatalogName);

		const targetItem = targetCatalogUpdated.findItemByItemPath(to.join(new Path(CATEGORY_ROOT_FILENAME)));
		await targetItem.setOrderAfter(targetCatalogUpdated.getRootCategory(), null);

		await sourceCatalog.deref.update();
		const sourceCatalogUpdated = await current.getContextlessCatalog(sourceCatalogName);

		assert(targetItem, `target item of ${targetCatalogUpdated.name} not found: ${new Path(setName).value}`);
		assert(
			!sourceCatalogUpdated.findItemByItemPath(articlePath),
			"source item still exists in source catalog. this is an error and should not happen",
		);
		assert(
			!(await current.getFileProvider().exists(sourceCategory.ref.path.parentDirectoryPath)),
			"source category parent directory should not exist",
		);

		return { redirectTo: await targetCatalogUpdated.getPathname(targetItem) };
	},

	params(ctx, q): MoveProps {
		const articlePath = new Path(q.articlePath);
		const setName = q.setName;
		const setTitle = q.setTitle;
		const targetWorkspacePath = q.targetWorkspacePath;
		const sourceCatalogName = q.sourceCatalogName;
		const targetCatalogName = q.targetCatalogName;
		const resolution = q.resolution as CatalogMoveConflictResolution;

		return {
			ctx,
			articlePath,
			setName,
			setTitle,
			targetWorkspacePath: targetWorkspacePath.toString(),
			targetCatalogName,
			sourceCatalogName,
			resolution,
		};
	},
});

export default move;
