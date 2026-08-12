import type { FilterAndSortProps } from "@ext/markdown/elements/table/edit/model/tableTypes";
import { useSyncExternalStore } from "react";

const store = new Map<number, FilterAndSortProps>();
const listeners = new Set<() => void>();

const subscribe = (callback: () => void) => {
	listeners.add(callback);
	return () => listeners.delete(callback);
};

const emit = () => {
	listeners.forEach((l) => l());
};

const updateTableProps = (tablePos: number, props: FilterAndSortProps) => {
	store.set(tablePos, { ...(store.get(tablePos) || {}), ...props });
	emit();
};

const useTableProps = (tablePos: number) => {
	return useSyncExternalStore(subscribe, () => store.get(tablePos));
};

const useFilterAndSortProps = (tablePos: number) => {
	return useSyncExternalStore(subscribe, () => store.get(tablePos));
};

const tablePropsStore = {
	updateTableProps,
	useFilterAndSortProps,
	useTableProps,
};

export default tablePropsStore;
