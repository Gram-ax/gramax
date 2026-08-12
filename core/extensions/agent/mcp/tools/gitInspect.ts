import Path from "@core/FileProvider/Path/Path";
import { getDiff } from "@ext/VersionControl/DiffHandler/DiffHandler";
import { fail, ok, type ToolExecutionContext, type ToolExecutionResult } from "../tool";

type InspectAction = "status" | "file_diff";
type GitInspectInput = {
	catalogName: string;
	action: InspectAction;
	filePath?: string;
};

export async function runGitInspect({ app, input }: ToolExecutionContext): Promise<ToolExecutionResult> {
	const { action: actionRaw, catalogName, filePath } = input as GitInspectInput;
	const action = actionRaw;

	try {
		const catalog = await app.wm.current().getContextlessCatalog(catalogName);
		if (!catalog?.repo?.gvc) {
			return fail("Git repository not available");
		}
		const gvc = catalog.repo.gvc;

		if (action === "status") {
			const [workdir, index, workdirDiff, indexDiff] = await Promise.all([
				gvc.getChanges("workdir"),
				gvc.getChanges("index"),
				gvc.diff({
					compare: { type: "workdir" },
					renames: true,
				}),
				gvc.diff({
					compare: { type: "index" },
					renames: true,
				}),
			]);
			const changeByPath = new Map<string, { path: string; absolutePath: string; status: unknown }>();
			for (const change of [...workdir, ...index]) {
				if (changeByPath.has(change.path.value)) continue;
				changeByPath.set(change.path.value, {
					path: change.path.value,
					absolutePath: catalog.basePath.join(change.path).value,
					status: change.status,
				});
			}
			const statsByPath = new Map<string, { added: number; deleted: number }>();
			for (const file of [...workdirDiff.files, ...indexDiff.files]) {
				const key = file.path.value;
				const prev = statsByPath.get(key) ?? { added: 0, deleted: 0 };
				statsByPath.set(key, {
					added: prev.added + (file.added ?? 0),
					deleted: prev.deleted + (file.deleted ?? 0),
				});
			}
			const changes = Array.from(changeByPath.values()).map((change) => {
				const stats = statsByPath.get(change.path) ?? { added: 0, deleted: 0 };
				return {
					...change,
					added: stats.added,
					deleted: stats.deleted,
				};
			});
			const totals = changes.reduce(
				(acc, change) => {
					acc.added += change.added;
					acc.deleted += change.deleted;
					return acc;
				},
				{ added: 0, deleted: 0 },
			);
			return ok({
				catalogName,
				changes,
				totals,
			});
		}

		const diff = await gvc.diff({
			compare: { type: "workdir" },
			renames: true,
		});

		if (!filePath) {
			return fail("file_diff requires filePath");
		}
		const target = new Path(filePath);
		const file = diff.files.find((entry) => {
			if (target.compare(entry.path) || target.compare(catalog.basePath.join(entry.path))) return true;
			if (!entry.oldPath) return false;
			return target.compare(entry.oldPath) || target.compare(catalog.basePath.join(entry.oldPath));
		});
		if (!file) {
			return ok({ catalogName, filePath, hasChanges: false, file: null });
		}

		const wmFp = app.wm.current().getFileProvider();
		const currentPath = catalog.basePath.join(file.path);
		const currentContent = await wmFp.read(currentPath).catch(() => "");
		const previousContent = await gvc
			.getHeadCommit()
			.then((headCommit) => gvc.showFileContent(file.oldPath ?? file.path, headCommit))
			.catch(() => "");
		const hunks = getDiff(previousContent, currentContent, { words: false }).changes;

		return ok({
			catalogName,
			filePath,
			hasChanges: true,
			file: {
				path: file.path.value,
				oldPath: file.oldPath?.value ?? null,
				status: file.status,
				added: file.added,
				deleted: file.deleted,
				hunks,
			},
		});
	} catch (e) {
		const msg = e instanceof Error ? e.message : String(e);
		return fail(`Failed to inspect git: ${msg}`);
	}
}
