import GitCommands from "@ext/git/core/GitCommands/GitCommands";
import { GitVersion } from "@ext/git/core/model/GitVersion";

const getDistanceToCommonCommit = async (
	branchA: string,
	branchB: string,
	gr: GitCommands,
): Promise<{ a: number; b: number }> => {
	const headA = (await gr.getHeadCommit(branchA)).toString();
	const headB = (await gr.getHeadCommit(branchB)).toString();
	if (headA === headB) return { a: 0, b: 0 };

	const commitHistoryA: string[] = [headA.toString()];
	const commitHistoryB: string[] = [headB.toString()];
	// eslint-disable-next-line no-constant-condition
	while (true) {
		if (getLastElement(commitHistoryA)) {
			commitHistoryA.push(
				await gr.getParentCommit(new GitVersion(getLastElement(commitHistoryA))).then((x) => x.toString()),
			);
		}
		const aParent = getLastElement(commitHistoryA);

		if (getLastElement(commitHistoryB)) {
			commitHistoryB.push(
				await gr.getParentCommit(new GitVersion(getLastElement(commitHistoryB))).then((x) => x.toString()),
			);
		}
		const bParent = getLastElement(commitHistoryB);

		if (commitHistoryB.includes(aParent)) {
			return {
				a: commitHistoryA.length - 1,
				b: commitHistoryB.indexOf(aParent),
			};
		}
		if (commitHistoryA.includes(bParent)) {
			return {
				a: commitHistoryA.indexOf(bParent),
				b: commitHistoryB.length - 1,
			};
		}
		if (commitHistoryB.length > 100 || commitHistoryA.length > 100) return { a: 0, b: 0 };
	}
};

export default getDistanceToCommonCommit;

const getLastElement = <T>(array: T[]): T => {
	return array[array.length - 1];
};
