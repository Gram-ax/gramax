import type SideBarData from "@ext/git/actions/Publish/model/SideBarData";
import getScopeFromString from "@ext/git/core/Diff/logic/utils/getScopeFromString";
import type { DiffTree2TreeFile, TreeReadScope } from "@ext/git/core/GitCommands/model/GitCommandsModel";
import BrokenRepository from "@ext/git/core/Repository/BrokenRepository";
import { getDiff } from "@ext/VersionControl/DiffHandler/DiffHandler";
import { FileStatus } from "@ext/Watchers/model/FileStatus";
import type { Article } from "../../../../../../logic/FileStructue/Article/Article";
import type { ReadonlyCatalog } from "../../../../../../logic/FileStructue/Catalog/ReadonlyCatalog";

interface GetArticleDiffSideBarDataParams {
	article: Article;
	catalog: ReadonlyCatalog;
	scopedCatalog: ReadonlyCatalog;
	isDeleted: boolean;
	pathname: string;
	logicPath: string;
	oldScope?: string;
}

const getTreeForDiff = (scope: TreeReadScope): string => {
	let treeForDiff: string;

	if (scope && scope !== "HEAD") {
		if ("commit" in scope) treeForDiff = scope.commit;
		else if ("reference" in scope) treeForDiff = scope.reference;
	}

	return treeForDiff;
};

const stripCatalogPrefix = (p: string, catalogName: string) =>
	p.startsWith(`${catalogName}/`) ? p.slice(catalogName.length + 1) : p;

export const getArticleDiffSideBarData = async (props: GetArticleDiffSideBarDataParams): Promise<SideBarData> => {
	const { article, catalog, scopedCatalog, isDeleted, pathname, logicPath, oldScope } = props;
	const repoPath = scopedCatalog.getRepositoryRelativePath(article.ref).value;

	let path = stripCatalogPrefix(repoPath, scopedCatalog.name);
	let oldPath = path;
	let status: FileStatus;

	if (isDeleted) {
		status = FileStatus.delete;
	} else if (!catalog.repo?.gvc || catalog.repo instanceof BrokenRepository) {
		// no-op
	} else
		try {
			const parsedOldScope = getScopeFromString(oldScope);
			const treeForDiff = getTreeForDiff(parsedOldScope);

			const cacheKey = treeForDiff ?? "";
			const cached = catalog.repo.gvc.getCachedDiff(cacheKey);
			const diffInfo =
				cached ??
				(await catalog.repo.gvc.diff({
					compare: { type: "index", tree: treeForDiff },
					renames: true,
				}));

			if (!cached) catalog.repo.gvc.setCachedDiff(cacheKey, diffInfo);
			const diffFile = diffInfo?.files.find(
				(f: DiffTree2TreeFile) =>
					f.path.value === repoPath ||
					f.path.value === path ||
					f.path.value.endsWith(path) ||
					f.oldPath?.value === repoPath ||
					f.oldPath?.value === path,
			);

			status = diffFile?.status ?? FileStatus.current;
			if (diffFile) {
				path = stripCatalogPrefix(diffFile.path.value, scopedCatalog.name);
				oldPath = diffFile.oldPath?.value
					? stripCatalogPrefix(diffFile.oldPath.value, scopedCatalog.name)
					: path;
			}
		} catch (e) {
			console.error(e);
			return {
				isResource: false,
				pathname,
				data: {
					title: article.getTitle(),
					filePath: { path, oldPath, hunks: [] },
					status,
					isChanged: true,
					logicPath,
					resources: [],
					isChecked: true,
				},
			};
		}

	return {
		isResource: false,
		pathname,
		data: {
			title: article.getTitle(),
			filePath: {
				path,
				oldPath,
				hunks: getDiff(oldPath, path, { words: false }).changes,
			},
			status,
			isChanged: true,
			logicPath,
			resources: [],
			isChecked: true,
		},
	};
};
