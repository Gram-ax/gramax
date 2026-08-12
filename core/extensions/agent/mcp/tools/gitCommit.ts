import Path from "@core/FileProvider/Path/Path";
import { fail, ok, type ToolExecutionContext, type ToolExecutionResult } from "../tool";

type GitCommitInput = {
	catalogName: string;
	message: string;
	filePaths?: string[];
};

export async function runGitCommit({ app, ctx, input }: ToolExecutionContext): Promise<ToolExecutionResult> {
	const { filePaths, catalogName, message } = input as GitCommitInput;
	if (!message.trim()) {
		return fail("Commit message must not be empty");
	}

	try {
		const catalog = await app.wm.current().getContextlessCatalog(catalogName);
		if (!catalog?.repo?.gvc) {
			return fail("Git repository not available");
		}
		if (!catalog.repo.storage) {
			return fail("Storage is required to resolve commit author data");
		}
		const sourceData = app.rp.getSourceData(ctx, await catalog.repo.storage.getSourceName());
		const gvc = catalog.repo.gvc;

		let commitPaths: Path[];
		if (filePaths?.length) {
			const seen = new Set<string>();
			commitPaths = filePaths
				.map((path) => new Path(path))
				.filter((path) => {
					if (seen.has(path.value)) return false;
					seen.add(path.value);
					return true;
				});
		} else {
			const [workdir, index] = await Promise.all([gvc.getChanges("workdir"), gvc.getChanges("index")]);
			const seen = new Set<string>();
			commitPaths = [...workdir.map((s) => s.path), ...index.map((s) => s.path)].filter((path) => {
				if (seen.has(path.value)) return false;
				seen.add(path.value);
				return true;
			});
		}

		if (!commitPaths.length) {
			return fail("No changes to commit");
		}

		await gvc.add(commitPaths);
		await gvc.commit(message, sourceData, undefined, commitPaths);
		await catalog.repo.storage.updateSyncCount();

		return ok({
			catalogName,
			message: message.trim(),
			committedPaths: commitPaths.map((path) => path.value),
			pushed: false,
			mergeRequestCreated: false,
		});
	} catch (e) {
		const msg = e instanceof Error ? e.message : String(e);
		return fail(`Failed to commit changes: ${msg}`);
	}
}
