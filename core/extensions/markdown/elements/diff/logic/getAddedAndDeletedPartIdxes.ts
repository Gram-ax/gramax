import { DiffHunk } from "@ext/VersionControl/DiffHandler/model/DiffHunk";

const getAddedAndDeletedPartIdxes = (diff: DiffHunk[]) => {
	const addedParts: [number, number][] = [];
	const deletedParts: [number, number][] = [];

	let addedOffset = 0;
	let deletedOffset = 0;

	diff.forEach((part) => {
		if (part.type === "delete") {
			deletedParts.push([deletedOffset, deletedOffset + part.value.length - 1]);
			deletedOffset += part.value.length;
		} else if (part.type === "new") {
			addedParts.push([addedOffset, addedOffset + part.value.length - 1]);
			addedOffset += part.value.length;
		} else {
			addedOffset += part.value.length;
			deletedOffset += part.value.length;
		}
	});

	return {
		addedParts,
		deletedParts,
	};
};

export default getAddedAndDeletedPartIdxes;
