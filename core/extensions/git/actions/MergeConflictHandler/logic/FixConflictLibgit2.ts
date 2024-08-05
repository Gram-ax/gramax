import FileProvider from "@core/FileProvider/model/FileProvider";
import Path from "@core/FileProvider/Path/Path";
import gitMergeConverter from "@ext/git/actions/MergeConflictHandler/logic/GitMergeConverter";
import haveConflictWithFileDelete from "@ext/git/actions/MergeConflictHandler/logic/haveConflictWithFileDelete";
import GitMergeStatus from "@ext/git/actions/MergeConflictHandler/model/GitMergeStatus";
import {
	GitMarkers,
	MergeConflictParser,
} from "@ext/git/actions/MergeConflictHandler/Monaco/logic/mergeConflictParser";
import GitCommands from "@ext/git/core/GitCommands/GitCommands";
import { MergeResult } from "@ext/git/core/GitCommands/LibGit2IntermediateCommands";
import GitStash from "@ext/git/core/model/GitStash";
import { GitVersion } from "@ext/git/core/model/GitVersion";

const fixMerge = async (
	mergeResult: MergeResult,
	fp: FileProvider,
	repPath: Path,
	gitCommands: GitCommands,
	currentHash: GitVersion,
	theirsBranchHashOrStash: GitVersion | GitStash,
): Promise<MergeResult> => {
	const filesToAdd: Path[] = [];
	const promiseResult = mergeResult.map(async (r): Promise<typeof r> => {
		const convertedStatus = gitMergeConverter([r])[0];
		const filePath = convertedStatus.path;

		if (await fp.exists(repPath.join(new Path(filePath + "~" + "Updated upstream")))) {
			const upstreamPath = new Path(filePath + "~" + "Updated upstream");
			const upstreamContent = await fp.read(repPath.join(upstreamPath));

			const stashedPath = new Path(filePath + "~" + "Stashed changes");
			const stashedContent = await fp.read(repPath.join(stashedPath));

			const isContentEqual = upstreamContent === stashedContent;

			const commonFileContent = isContentEqual
				? upstreamContent
				: `${GitMarkers.startHeader} Updated upstream\n${upstreamContent}\n${GitMarkers.splitter}\n${stashedContent}\n${GitMarkers.endFooter} Stashed changes\n`;

			await fp.write(repPath.join(new Path(filePath)), commonFileContent);
			await fp.delete(repPath.join(upstreamPath));
			await fp.delete(repPath.join(stashedPath));

			if (isContentEqual) {
				filesToAdd.push(new Path(filePath));
				return;
			}
		} else if (await fp.exists(repPath.join(new Path(filePath + "~" + "ours")))) {
			const oursPath = new Path(filePath + "~" + "ours");
			const oursContent = await fp.read(repPath.join(oursPath));

			const theirsPath = new Path(filePath + "~" + "theirs");
			const theirsContent = await fp.read(repPath.join(theirsPath));

			const isContentEqual = oursContent === theirsContent;
			const commonFileContent = isContentEqual
				? oursContent
				: `${GitMarkers.startHeader} ours\n${oursContent}\n${GitMarkers.splitter}\n${theirsContent}\n${GitMarkers.endFooter} theirs\n`;

			await fp.write(repPath.join(new Path(filePath)), commonFileContent);
			await fp.delete(repPath.join(oursPath));
			await fp.delete(repPath.join(theirsPath));

			if (isContentEqual) {
				filesToAdd.push(new Path(filePath));
				return;
			}
		}
		if (
			(await fp.exists(repPath.join(new Path(convertedStatus.path)))) &&
			haveConflictWithFileDelete(convertedStatus.status)
		) {
			const content = await fp.read(repPath.join(new Path(filePath)));
			if (MergeConflictParser.containsConflict(content)) {
				return { ancestor: r.ancestor, ours: convertedStatus.path, theirs: convertedStatus.path };
			}
		}
		const path = new Path(convertedStatus.path);
		if (!(await fp.exists(repPath.join(path)))) {
			if (
				convertedStatus.status === GitMergeStatus.AddedByThem ||
				convertedStatus.status === GitMergeStatus.DeletedByUs
			) {
				const content = await gitCommands.showFileContent(path, theirsBranchHashOrStash);
				await fp.write(repPath.join(path), content);
			} else if (
				convertedStatus.status === GitMergeStatus.AddedByUs ||
				convertedStatus.status === GitMergeStatus.DeletedByThem
			) {
				const content = await gitCommands.showFileContent(path, currentHash);
				await fp.write(repPath.join(path), content);
			}
		}
		return r;
	});

	const result: MergeResult = [];

	for (const r of promiseResult) result.push(await r);
	if (filesToAdd.length) await gitCommands.add(filesToAdd);

	return result.filter(Boolean);
};

export default fixMerge;
