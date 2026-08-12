import Path from "@core/FileProvider/Path/Path";
import { fail, ok, type ToolExecutionContext, type ToolExecutionResult } from "../tool";

type GitDiscardInput = {
	catalogName: string;
	filePaths?: string[];
};

export async function runGitDiscard({ app, input }: ToolExecutionContext): Promise<ToolExecutionResult> {
	const { filePaths, catalogName } = input as GitDiscardInput;
	const hasFilePaths = !!filePaths?.length;

	try {
		const catalog = await app.wm.current().getContextlessCatalog(catalogName);
		if (!catalog?.repo?.gvc) {
			return fail("Git repository not available");
		}
		const gvc = catalog.repo.gvc;

		const targetPaths = hasFilePaths
			? (filePaths ?? []).map((path) => new Path(path))
			: Array.from(
					new Map(
						[
							...(await gvc.getChanges("workdir")).map((change) => change.path),
							...(await gvc.getChanges("index")).map((change) => change.path),
						].map((path) => [path.value, path]),
					).values(),
				);

		if (!targetPaths.length) {
			return ok(
				{
					catalogName,
					discarded: [],
					mode: hasFilePaths ? "paths" : "all",
				},
				true,
			);
		}

		await gvc.discard(targetPaths);
		await app.wm.current().refreshCatalog(catalogName);
		return ok(
			{
				catalogName,
				discarded: targetPaths.map((path) => path.value),
				mode: hasFilePaths ? "paths" : "all",
			},
			true,
		);
	} catch (e) {
		const msg = e instanceof Error ? e.message : String(e);
		return fail(`Failed to discard changes: ${msg}`);
	}
}
