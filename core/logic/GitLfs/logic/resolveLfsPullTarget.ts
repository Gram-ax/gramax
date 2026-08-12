import type MountFileProvider from "@core/FileProvider/MountFileProvider/MountFileProvider";
import type FileProvider from "@core/FileProvider/model/FileProvider";
import type ReadOnlyFileProvider from "@core/FileProvider/model/ReadOnlyFileProvider";
import Path from "@core/FileProvider/Path/Path";
import type { TreeReadScope } from "@ext/git/core/GitCommands/model/GitCommandsModel";
import type GitTreeFileProvider from "@ext/versioning/GitTreeFileProvider";
import { normalizeTreeScope } from "@ext/versioning/GitTreeScopeParser";

export type LfsPullTarget = { path: Path; scope?: TreeReadScope };

// Detect the providers structurally instead of with `instanceof`. A *value* import of
// MountFileProvider or GitTreeFileProvider drags the whole Node backend (resolveModule/backend +
// rustcall → better-sqlite3, sharp, pdf, native `.node`) into the client bundle, because this helper
// is reachable from the browser markdown parser (handlePasteMarkdown). `at` is unique to
// MountFileProvider and `getNativeScope` is unique to GitTreeFileProvider, so type-only imports plus
// a method check keep this module client-safe while staying type-checked.
const isMount = (fp: FileProvider): fp is MountFileProvider =>
	typeof (fp as Partial<MountFileProvider>).at === "function";

const isGitTree = (fp: FileProvider | ReadOnlyFileProvider): fp is GitTreeFileProvider =>
	typeof (fp as Partial<GitTreeFileProvider>).getNativeScope === "function";

/**
 * When `absolutePath` is served by a GitTreeFileProvider (scoped catalogs, bare repos), the LFS
 * pointer must be pulled from that provider's git tree with a tree-relative path. Returns null for
 * any other provider, so the caller falls back to its own repo-relative workdir pull.
 */
export const resolveLfsPullTarget = (fp: FileProvider, absolutePath: Path): LfsPullTarget | null => {
	const treeFp = isMount(fp) ? fp.at(absolutePath) : fp;
	if (!isGitTree(treeFp)) return null;

	const { scope, scopedPath } = treeFp.getNativeScope(absolutePath);
	const treeScope = scope.kind === "git" ? normalizeTreeScope(scope.scope) : undefined;
	return { path: new Path(scopedPath), scope: treeScope };
};
