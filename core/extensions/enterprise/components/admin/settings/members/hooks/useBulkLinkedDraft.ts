import { coverageColumn } from "@ext/enterprise/components/admin/settings/members/config/coverageColumn";
import { type Dispatch, type SetStateAction, useCallback, useMemo } from "react";

type EntId = string;
type ContId = string;

export interface AddingLinkedEntry<TEnt> {
	ent: TEnt;
}

interface LinkedRow<TCont> {
	cont: TCont;
}

export interface BulkLinkedRow<TEnt, TCont> {
	ent: TEnt;
	containers: Map<ContId, LinkedRow<TCont>>;
}

interface UseBulkLinkedDraftArgs<TEnt, TCont> {
	rowsMap: Map<EntId, BulkLinkedRow<TEnt, TCont>>;
	setRowsMap: Dispatch<SetStateAction<Map<EntId, BulkLinkedRow<TEnt, TCont>>>>;
	allContainers: TCont[];
	getEntId: (x: TEnt) => EntId;
	getContId: (x: TCont) => ContId;
}

export function useBulkLinkedDraft<TEnt, TCont>(args: UseBulkLinkedDraftArgs<TEnt, TCont>) {
	const { rowsMap, setRowsMap, allContainers, getEntId, getContId } = args;

	const remove = useCallback(
		(ids: EntId[]) => {
			setRowsMap((prev) => {
				const next = new Map(prev);
				for (const id of ids) next.delete(id);
				return next;
			});
		},
		[setRowsMap],
	);

	const add = useCallback(
		(entries: AddingLinkedEntry<TEnt>[]) => {
			setRowsMap((prev) => {
				const next = new Map(prev);
				for (const entry of entries) {
					const nextLinked = new Map(allContainers.map((x) => [getContId(x), { cont: x }]));
					next.set(getEntId(entry.ent), { ent: entry.ent, containers: nextLinked });
				}
				return next;
			});
		},
		[allContainers, getEntId, getContId, setRowsMap],
	);

	const applyToAll = useCallback(
		(rows: BulkLinkedRow<TEnt, TCont>[]) => {
			setRowsMap((prev) => {
				const next = new Map(prev);
				for (const row of rows) {
					const nextLinked = new Map(row.containers);
					for (const item of allContainers) {
						const contId = getContId(item);
						if (!nextLinked.has(contId)) {
							nextLinked.set(contId, { cont: item });
						}
					}
					next.set(getEntId(row.ent), { ...row, containers: nextLinked });
				}
				return next;
			});
		},
		[allContainers, getContId, getEntId, setRowsMap],
	);

	const columns = useMemo(
		() => [
			coverageColumn<BulkLinkedRow<TEnt, TCont>>({
				getTotal: () => allContainers.length,
				getCoverage: (row) => row.containers.size,
				getNames: (row) => [...row.containers.keys()],
			}),
		],
		[allContainers],
	);

	const rows = useMemo(() => [...rowsMap.values()], [rowsMap]);

	return {
		rows,
		columns,
		remove,
		add,
		applyToAll,
	};
}
