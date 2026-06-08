import type { FilterAndSortProps } from "@ext/markdown/elements/table/edit/model/tableTypes";
import { useSyncExternalStore } from "react";

const store = new Map<number, FilterAndSortProps>();
const listeners = new Set<() => void>();

export const updateTableProps = (tablePos: number, props: FilterAndSortProps) => {
	store.set(tablePos, { ...(store.get(tablePos) || {}), ...props });
	listeners.forEach((l) => l());
};

export const useTableProps = (tablePos: number) => {
	return useSyncExternalStore(
		(callback) => {
			listeners.add(callback);
			return () => listeners.delete(callback);
		},
		() => store.get(tablePos),
	);
};
