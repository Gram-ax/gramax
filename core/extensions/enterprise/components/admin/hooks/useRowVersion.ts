import { useCallback, useState } from "react";

export const useRowVersion = <T>() => {
	const [rowVersions, setRowVersions] = useState<Map<T, number>>(new Map());

	const bumpRowVersion = useCallback((id: T) => {
		setRowVersions((prev) => {
			const next = new Map(prev);
			next.set(id, (next.get(id) ?? 0) + 1);
			return next;
		});
	}, []);

	return { rowVersions, bumpRowVersion };
};
