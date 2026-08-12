import { getExecutingEnvironment } from "@app/resolveModule/env";
import { getAutoPullSourceData, getWebhookSourceData } from "@core/AutoPull/AutoPull";
import type Context from "@core/Context/Context";
import type Path from "@core/FileProvider/Path/Path";
import type BaseCatalog from "@core/FileStructue/Catalog/BaseCatalog";
import type { ReadonlyCatalog } from "@core/FileStructue/Catalog/ReadonlyCatalog";
import type { TreeReadScope } from "@ext/git/core/GitCommands/model/GitCommandsModel";
import type GitSourceData from "@ext/git/core/model/GitSourceData.schema";
import type RepositoryProvider from "@ext/git/core/Repository/RepositoryProvider";
import SourceType from "@ext/storage/logic/SourceDataProvider/model/SourceType";
import { normalizeTreeScope } from "@ext/versioning/GitTreeScopeParser";

interface ResolveGitLfsSourceDataArgs {
	catalog: BaseCatalog | ReadonlyCatalog;
	ctx?: Context;
	rp: RepositoryProvider;
}

interface PullGitLfsObjectsArgs extends ResolveGitLfsSourceDataArgs {
	paths: Path[];
	sourceData?: GitSourceData;
	scope?: TreeReadScope;
}

export async function resolveGitLfsSourceData({
	catalog,
	ctx,
	rp,
}: ResolveGitLfsSourceDataArgs): Promise<GitSourceData | null> {
	if (!ctx || !catalog.repo) return null;

	if (!catalog.repo.storage) {
		if (getExecutingEnvironment() === "next") {
			return getWebhookSourceData("", SourceType.git);
		}
		return null;
	}

	const sourceName = await catalog.repo.storage.getSourceName();

	return (
		(rp.getSourceData(ctx, sourceName) as GitSourceData) ??
		(getExecutingEnvironment() === "next"
			? getAutoPullSourceData(sourceName, await catalog.repo.storage.getType())
			: null)
	);
}

export function toRepoRelativeLfsPath(catalog: BaseCatalog | ReadonlyCatalog, path: Path): Path {
	if (!catalog.repo) return path;
	return catalog.repo.path.subDirectory(path) ?? path;
}

export async function pullGitLfsObjects({
	catalog,
	ctx,
	paths,
	rp,
	sourceData,
	scope,
}: PullGitLfsObjectsArgs): Promise<boolean> {
	if (!paths.length) return false;

	const repo = catalog.repo;
	if (!repo?.gvc) throw new Error("provided catalog does not have gvc; can not perform lfs pull");

	const resolvedSourceData = sourceData ?? (await resolveGitLfsSourceData({ catalog, ctx, rp }));
	if (!resolvedSourceData) return false;

	// scoped pull reads from a git tree, so a checkout of HEAD paths is pointless and harmful
	const treeScope = normalizeTreeScope(scope);
	const checkout = treeScope ? false : !catalog.repo.isBare;
	await repo.gvc.pullLfsObjects(resolvedSourceData, paths, checkout, treeScope);
	return true;
}
