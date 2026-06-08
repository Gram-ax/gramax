import type { SortState } from "@ext/markdown/elements/table/edit/model/tableTypes";

type SortRecord = Record<number, (typeof SortState)[keyof typeof SortState]>;

export const sortTableRows = (rows: string[][], sort: SortRecord): string[][] => {
	if (!rows || rows.length <= 1) return rows;
	if (!sort || Object.keys(sort).length === 0) return rows;

	const [header, ...body] = rows;

	const sorted = [...body].sort((a, b) => {
		for (const [colIndexStr, order] of Object.entries(sort)) {
			const colIndex = Number(colIndexStr);

			const aVal = a[colIndex] ?? "";
			const bVal = b[colIndex] ?? "";

			const aNum = Number(aVal);
			const bNum = Number(bVal);

			let compare = 0;

			if (!Number.isNaN(aNum) && !Number.isNaN(bNum)) {
				compare = aNum - bNum;
			} else {
				compare = aVal.localeCompare(bVal, undefined, {
					numeric: true,
					sensitivity: "base",
				});
			}

			if (compare !== 0) {
				return order === "asc" ? compare : -compare;
			}
		}

		return 0;
	});

	return [header, ...sorted];
};
