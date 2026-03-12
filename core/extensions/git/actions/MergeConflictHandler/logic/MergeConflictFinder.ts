export interface MergeConflictData {
	/**
	 * Content after `<<<<<<<` and before `=======`. Can be empty.
	 */
	topText: string;

	/**
	 * Content after `=======` and before `>>>>>>>`. Can be empty.
	 */
	bottomText: string;

	/**
	 * Revision of the top text. Example: `<<<<<<< HEAD`, top revision is `HEAD`. Can be empty.
	 */
	topRevision: string;

	/**
	 * Revision of the bottom text. Example: `>>>>>>> branch-name`, bottom revision is `branch-name`. Can be empty.
	 */
	bottomRevision: string;
}

export const mergeConflictRegExp =
	/<<<<<<< ?([^\r\n]*?)\r?\n([\s\S]*?)(\r?\n?)=======\r?\n([\s\S]*?)(\r?\n?)>>>>>>> ?(.*)(\r?\n?)/g;

export const findMergeConflict = (text: string): MergeConflictData[] => {
	const conflicts: MergeConflictData[] = [];
	let match: RegExpExecArray;

	// biome-ignore lint/suspicious/noAssignInExpressions: expected
	while ((match = mergeConflictRegExp.exec(text)) !== null) {
		conflicts.push({
			topRevision: match[1],
			topText: match[2],
			bottomText: match[4],
			bottomRevision: match[6],
		});
	}

	return conflicts;
};
