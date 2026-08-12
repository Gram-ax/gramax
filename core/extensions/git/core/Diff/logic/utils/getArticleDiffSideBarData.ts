import type SideBarData from "@ext/git/actions/Publish/model/SideBarData";
import { getDiffCacheKey } from "@ext/git/core/Diff/logic/utils/getDiffCacheKey";
import type { DiffTree2TreeFile, TreeReadScope } from "@ext/git/core/GitCommands/model/GitCommandsModel";
import BrokenRepository from "@ext/git/core/Repository/BrokenRepository";
import { getDiff } from "@ext/VersionControl/DiffHandler/DiffHandler";
import { GitTreeScopeParser } from "@ext/versioning/GitTreeScopeParser";
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
	scope?: string;
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

export const getArticleDiffSideBarData = async (props: GetArticleDiffSideBarDataParams): Promise<SideBarData> => {
	const { article, catalog, scopedCatalog, isDeleted, pathname, logicPath, scope, oldScope } = props;

	if (!article.ref.path.value) return null;

	let repoPath: string;
	try {
		repoPath = scopedCatalog.getRepositoryRelativePath(article.ref).value;
	} catch {
		// getRepositoryRelativePath asserts when the ref is not under the (scoped) catalog
		// basePath — e.g. a diff view item that lives outside the current scope. Degrade to a
		// hunk-less sidebar entry instead of crashing the whole diff render (Bugsnag 6a2033e0).
		const fallbackPath = article.ref?.path?.value ?? logicPath;
		return {
			isResource: false,
			pathname,
			data: {
				title: article.getTitle(),
				filePath: { path: fallbackPath, oldPath: fallbackPath, hunks: [] },
				status: isDeleted ? FileStatus.delete : FileStatus.current,
				isChanged: true,
				logicPath,
				resources: [],
				isChecked: true,
			},
		};
	}

	let path = repoPath;
	let oldPath = path;
	let status: FileStatus;

	if (isDeleted) {
		status = FileStatus.delete;
	} else if (!catalog.repo?.gvc || catalog.repo instanceof BrokenRepository) {
		// no-op
	} else
		try {
			const parsedOldScope = GitTreeScopeParser.parse(oldScope);
			const treeForDiff = getTreeForDiff(parsedOldScope);

			const parsedScope = GitTreeScopeParser.parse(scope);
			const treeForNew = getTreeForDiff(parsedScope);

			const compare =
				treeForDiff && treeForNew
					? { type: "tree" as const, old: treeForDiff, new: treeForNew }
					: { type: "index" as const, tree: treeForDiff };

			const cacheKey = getDiffCacheKey(treeForDiff, treeForNew);
			const cached = catalog.repo.gvc.getCachedDiff(cacheKey);
			const diffInfo =
				cached ??
				(await catalog.repo.gvc.diff({
					compare,
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
				path = diffFile.path.value;
				oldPath = diffFile.oldPath?.value ?? path;
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
