import { useCallback, useState } from "react";
import { loadMetricsFilters, saveFilters } from "./storage";
import type { MetricsFiltersStorage } from "./types";

export const useMetricsFilters = <T extends keyof MetricsFiltersStorage>(type: T) => {
	const [storage, setStorageState] = useState<MetricsFiltersStorage>(() => loadMetricsFilters());

	const filters = storage[type];

	const setFilters = useCallback(
		(updates: Partial<MetricsFiltersStorage[T]>) => {
			setStorageState((prev) => {
				const newStorage = {
					...prev,
					[type]: { ...prev[type], ...updates },
				};
				saveFilters(newStorage);
				return newStorage;
			});
		},
		[type],
	);

	return { filters, setFilters };
};

export default useMetricsFilters;
