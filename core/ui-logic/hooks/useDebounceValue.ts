import { useDebounce } from "@core-ui/hooks/useDebounce";
import { useMemo, useState } from "react";

export function useDebounceValue<T>(value: T, delayMs: number) {
	const [debouncedValue, setDebouncedValue] = useState(value);

	const { start, cancel } = useDebounce(setDebouncedValue, delayMs);

	useMemo(() => {
		start(value);
	}, [value, start]);

	return { value: debouncedValue, cancel };
}
