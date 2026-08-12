import type Context from "@core/Context/Context";
import type FileProvider from "@core/FileProvider/model/FileProvider";
import type Path from "@core/FileProvider/Path/Path";
import type BaseCatalog from "@core/FileStructue/Catalog/BaseCatalog";
import type { ReadonlyCatalog } from "@core/FileStructue/Catalog/ReadonlyCatalog";
import { isLikelyLfsPointer, LFS_POINTER_MAX_SIZE } from "@core/GitLfs/logic/isLikelyLfsPointer";
import { pullGitLfsObjects, toRepoRelativeLfsPath } from "@core/GitLfs/logic/pullGitLfsObjects";
import { resolveLfsPullTarget } from "@core/GitLfs/logic/resolveLfsPullTarget";
import type RepositoryProvider from "@ext/git/core/Repository/RepositoryProvider";

interface PullLfsResourceIfPointerArgs {
	fp: FileProvider;
	catalog: BaseCatalog | ReadonlyCatalog;
	absolutePath: Path;
	ctx: Context;
	rp: RepositoryProvider;
}

/**
 * Downloads the LFS object for `absolutePath` if the file is an unfetched pointer. Meant for read
 * paths that bypass ResourceManager (and therefore the lazy LFS loader), e.g. `article/resource/getByPath`.
 * Scope-aware: for a versioned catalog served by a GitTreeFileProvider the pointer is pulled from the
 * commit tree, otherwise a plain repo-relative workdir pull.
 */
export async function pullLfsResourceIfPointer({
	fp,
	catalog,
	absolutePath,
	ctx,
	rp,
}: PullLfsResourceIfPointerArgs): Promise<void> {
	if (!catalog.repo) return;

	const target = resolveLfsPullTarget(fp, absolutePath);

	// Off-tree (disk/workdir) an unfetched pointer stats at its on-disk size, so a real binary — larger
	// than any pointer — is skipped without a read and its single read is left to the caller. A
	// GitTreeFileProvider instead reports the pointer's declared object size (which is large), so the
	// size gate would wrongly skip it; there an unfetched pointer reads back cheaply as the pointer
	// bytes anyway, so read directly.
	if (!target) {
		const stat = await fp.getStat(absolutePath).catch(() => null);
		if (!stat || stat.size > LFS_POINTER_MAX_SIZE) return;
	}

	const content = await fp.readAsBinary(absolutePath).catch(() => null);
	if (!content || !isLikelyLfsPointer(content)) return;

	const pullTarget = target ?? { path: toRepoRelativeLfsPath(catalog, absolutePath) };
	await pullGitLfsObjects({ catalog, ctx, paths: [pullTarget.path], rp, scope: pullTarget.scope });
}
