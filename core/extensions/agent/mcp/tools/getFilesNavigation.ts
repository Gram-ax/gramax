import Path from "@core/FileProvider/Path/Path";
import { agentConfig } from "../../core/agentConfig";
import { fail, ok, type ToolExecutionContext, type ToolExecutionResult } from "../tool";
import { CatalogItemLookup } from "../utils/catalogPaths";

type GetFilesNavigationInput = {
	catalogName: string;
	dirPath?: string;
};

type RepoNavigationNode = {
	path: string;
	name: string;
	type: "file" | "dir" | "symbolic";
};

export async function runGetFilesNavigation({ app, ctx, input }: ToolExecutionContext): Promise<ToolExecutionResult> {
	const { catalogName, dirPath } = input as GetFilesNavigationInput;

	try {
		const catalog = await app.wm.current().getCatalog(catalogName, ctx);
		const wmFp = app.wm.current().getFileProvider();
		const normalizedDirPath = CatalogItemLookup.normalizePath(dirPath ?? "");
		const targetPath = normalizedDirPath ? catalog.basePath.join(new Path(normalizedDirPath)) : catalog.basePath;
		const relativePath = catalog.basePath.subDirectory(targetPath)?.removeExtraSymbols.value;
		if (relativePath == null) {
			return fail("Path resolves outside catalog root");
		}
		if (agentConfig.repoExcludedPathPatterns.some((pattern) => pattern.test(relativePath))) {
			return fail("Path is excluded by repository access policy");
		}
		if (!(await wmFp.exists(targetPath))) {
			return fail("Directory not found");
		}
		if (!(await wmFp.isFolder(targetPath))) {
			return fail("Target path is not a directory");
		}
		const children = (await wmFp.getItems(targetPath))
			.sort((a, b) => {
				if (a.type === b.type) return a.name.localeCompare(b.name);
				if (a.type === "dir") return -1;
				if (b.type === "dir") return 1;
				return a.name.localeCompare(b.name);
			})
			.map((item): RepoNavigationNode => {
				const itemPath = catalog.getRepositoryRelativePath(item.path).value;
				return {
					path: itemPath,
					name: item.name,
					type: item.type,
				};
			})
			.filter((item) => !agentConfig.repoExcludedPathPatterns.some((pattern) => pattern.test(item.path)));

		const rootName = relativePath.split("/").filter(Boolean).pop() ?? catalogName;
		const tree = {
			path: relativePath,
			name: rootName,
			type: "dir",
			children,
		};

		return ok({
			catalogName,
			root: {
				path: tree.path,
				name: tree.name,
				type: tree.type,
			},
			tree,
		});
	} catch (e) {
		const msg = e instanceof Error ? e.message : String(e);
		return fail(`Failed to build repository navigation: ${msg}`);
	}
}
