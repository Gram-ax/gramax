export const collectBy = <TRow, TVal>(
	rows: TRow[],
	getEntries: (row: TRow) => Iterable<[string, TVal]>,
): Map<string, TVal[]> => {
	const map = new Map<string, TVal[]>();
	for (const row of rows) {
		for (const [key, val] of getEntries(row)) {
			let list = map.get(key);
			if (!list) {
				list = [];
				map.set(key, list);
			}
			list.push(val);
		}
	}
	return map;
};
