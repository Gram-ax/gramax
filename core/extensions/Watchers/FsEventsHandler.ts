import type Context from "@core/Context/Context";
import Path from "@core/FileProvider/Path/Path";
import type { Article } from "@core/FileStructue/Article/Article";
import type { Catalog } from "@core/FileStructue/Catalog/Catalog";
import type { Item } from "@core/FileStructue/Item/Item";
import type SitePresenterFactory from "@core/SitePresenter/SitePresenterFactory";
import type { ItemLink } from "@ext/navigation/NavigationLinks";
import type { FsEventDto } from "@ext/Watchers/FsEvent";
import { shouldSkipFsEventsForRepositoryState } from "@ext/Watchers/fsEventPause";
import { PendingSelfWrites } from "@ext/Watchers/PendingSelfWrites";
import type { Workspace } from "@ext/workspace/Workspace";
import { classifyFsEvent } from "./classifyFsEvent";

export type FsHandleResult = {
	changedArticles: string[];
	navChanged: boolean;
	itemLinks: ItemLink[] | null;
	currentArticleRedirectTo: string | null;
	modifiedArticleProps?: { path: string; props: Partial<ItemLink> }[];
};

export const EMPTY_FS_HANDLE_RESULT: FsHandleResult = {
	changedArticles: [],
	navChanged: false,
	itemLinks: null,
	currentArticleRedirectTo: null,
};

export const handleFsEvents = async (params: {
	events: FsEventDto[];
	catalogName: string;
	currentPath?: string;
	workspace: Workspace | undefined;
	sitePresenterFactory: SitePresenterFactory;
	ctx: Context;
}): Promise<FsHandleResult> => {
	const { events, catalogName, currentPath, workspace, sitePresenterFactory, ctx } = params;
	if (!workspace || !events.length || !catalogName) return EMPTY_FS_HANDLE_RESULT;

	const catalog = await workspace.getContextlessCatalog(catalogName);
	if (!catalog) return EMPTY_FS_HANDLE_RESULT;

	const state = await catalog.repo?.getState?.();

	if (shouldSkipFsEventsForRepositoryState(state?.inner.value)) return EMPTY_FS_HANDLE_RESULT;

	const fp = workspace.getFileProvider();

	const isSelfWrite = (workspaceRel: string) =>
		PendingSelfWrites.covers(fp.rootPath.join(new Path(workspaceRel)).value);

	const isCurrentArticleResource = async (workspaceRel: string): Promise<boolean> => {
		if (!currentPath) return false;
		const item = catalog.findItemByItemPath<Article>(new Path(currentPath));
		if (!item) return false;
		const target = new Path(workspaceRel).removeExtraSymbols.value;
		return await item.parsedContent.read((parsed) => {
			if (!parsed) return false;
			const rm = parsed.parsedContext.getResourceManager();
			return rm.getAllPaths().some((res) => rm.getAbsolutePath(res).removeExtraSymbols.value === target);
		});
	};

	const changedArticles = new Set<string>();
	let navChanged = false;
	let renamedCurrentTo: string | null = null;

	for (const event of dedupeEvents(events)) {
		const classified = await classifyFsEvent(event, {
			catalog,
			fp,
			isSelfWrite,
			currentArticlePath: currentPath,
			isCurrentArticleResource,
		});
		if (classified.type === "structural") {
			navChanged = true;
			if (currentPath && event.kind.type === "renamed" && event.kind.from === currentPath)
				renamedCurrentTo = event.relPath;
		} else if (classified.type === "patch") {
			const { navPropsChanged } = await catalog.patchModified(classified.catalogRel);
			if (navPropsChanged) navChanged = true;
			changedArticles.add(classified.articleRelPath);
		}
	}

	if (navChanged) await catalog.update();

	const sp = sitePresenterFactory.fromContext(ctx);
	const itemLinks = navChanged ? await sp.getCatalogNav(catalog, currentPath ?? "") : null;
	const modifiedArticleProps = navChanged ? undefined : buildModifiedArticleProps(catalog, changedArticles);
	const currentArticleRedirectTo = currentPath
		? await findRedirectTarget(catalog, workspace, currentPath, renamedCurrentTo)
		: null;

	return {
		changedArticles: [...changedArticles],
		navChanged,
		itemLinks,
		currentArticleRedirectTo,
		modifiedArticleProps,
	};
};

const dedupeEvents = (events: FsEventDto[]): FsEventDto[] => {
	const seen = new Set<string>();
	return events.filter((e) => {
		const key = `${e.kind.type}:${e.relPath}:${e.kind.type === "renamed" ? e.kind.from : ""}`;
		if (seen.has(key)) return false;
		seen.add(key);
		return true;
	});
};

const buildModifiedArticleProps = (
	catalog: Catalog,
	changedArticles: Set<string>,
): { path: string; props: Partial<ItemLink> }[] | undefined => {
	if (changedArticles.size === 0) return undefined;
	const out: { path: string; props: Partial<ItemLink> }[] = [];
	for (const articlePath of changedArticles) {
		const item = catalog.findItemByItemPath(new Path(articlePath));
		if (item) out.push({ path: item.ref.path.value, props: { title: item.props.title?.toString() || "" } });
	}
	return out;
};

const findRedirectTarget = async (
	catalog: Catalog,
	workspace: Workspace,
	currentPath: string,
	renamedTo: string | null,
): Promise<string | null> => {
	const fp = workspace.getFileProvider();
	if (await fp.exists(new Path(currentPath))) return null;

	if (renamedTo) {
		const renamed = catalog.findItemByItemPath(new Path(renamedTo));
		if (renamed) return (await catalog.getPathname(renamed)) ?? null;
	}

	let target: Item | undefined;
	let folder = new Path(currentPath).parentDirectoryPath;
	while (folder.value) {
		const parent = catalog.findItemByItemPath(folder);
		if (parent) {
			target = parent;
			break;
		}
		folder = folder.parentDirectoryPath;
	}
	if (!target) target = catalog.getRootCategory().items[0];
	if (!target) return null;

	return (await catalog.getPathname(target)) ?? null;
};
