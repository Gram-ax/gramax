import FileProvider from "@core/FileProvider/model/FileProvider";
import Path from "@core/FileProvider/Path/Path";
import { GitMarkers } from "@ext/git/actions/MergeConflictHandler/Monaco/logic/mergeConflictParser";
import GitCommands from "@ext/git/core/GitCommands/GitCommands";
import { MergeResult } from "@ext/git/core/GitCommands/LibGit2IntermediateCommands";

const fixMerge = async (
	mergeResult: MergeResult,
	fp: FileProvider,
	repPath: Path,
	gitCommands: GitCommands,
): Promise<MergeResult> => {
	let result = mergeResult;

	for (const r of mergeResult) {
		if (!r.theirs && r.ours && r.theirs) continue;
		const filePath = r.ours;

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
				await gitCommands.add([new Path(filePath)]);
				result = result.filter((x) => !(!x.ancestor && x.ours && x.theirs && x.ours === filePath));
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
				await gitCommands.add([new Path(filePath)]);
				result = result.filter((x) => !(!x.ancestor && x.ours && x.theirs && x.ours === filePath));
			}
		}
	}
	return result;
};

export default fixMerge;
