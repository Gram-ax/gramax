import { type Dispatch, type SetStateAction, useCallback, useMemo } from "react";

type EntId = string;

interface UseLinkedItemsArgs<TEnt> {
	rowsMap: Map<EntId, TEnt>;
	setRowsMap: Dispatch<SetStateAction<Map<EntId, TEnt>>>;
	getId: (ent: TEnt) => EntId;
}

export const useLinkedItems = <TEnt>(args: UseLinkedItemsArgs<TEnt>) => {
	const { rowsMap, setRowsMap, getId } = args;

	const add = useCallback(
		(adding: TEnt[]) => {
			setRowsMap((prev) => {
				const next = new Map(prev);
				adding.forEach((x) => next.set(getId(x), x));
				return next;
			});
		},
		[getId, setRowsMap],
	);

	const remove = useCallback(
		(removing: EntId[]) => {
			setRowsMap((prev) => {
				const next = new Map(prev);
				removing.forEach((x) => next.delete(x));
				return next;
			});
		},
		[setRowsMap],
	);

	const rows = useMemo(() => [...rowsMap.values()], [rowsMap]);

	return {
		rows,
		add,
		remove,
	};
};
