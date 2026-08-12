export const upsertBy = <T>(list: T[], row: T, getKey: (item: T) => string): T[] => {
	const key = getKey(row);
	const idx = list.findIndex((item) => getKey(item) === key);
	if (idx < 0) return [...list, row];
	const next = [...list];
	next[idx] = row;
	return next;
};
