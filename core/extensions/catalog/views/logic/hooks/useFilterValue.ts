import { useCallback, useMemo } from "react";

interface useFilterValueProps {
	values: string[];
	value: string[];
	onChange: (value: string[]) => void;
}

export const useFilterValue = ({ values = [], value, onChange }: useFilterValueProps) => {
	const allValues = useMemo(() => [...values, "none"], [values]);

	const onSelectAll = useCallback(
		(e: Event | React.MouseEvent<HTMLButtonElement>) => {
			e.preventDefault();
			if (value.length === allValues.length) {
				onChange([]);
			} else {
				onChange(allValues);
			}
		},
		[value, allValues, onChange],
	);

	const onSelectNone = useCallback(
		(e: Event | React.MouseEvent<HTMLButtonElement>) => {
			e.preventDefault();
			if (value.includes("none")) {
				onChange(value.filter((v) => v !== "none"));
			} else {
				onChange([...value, "none"]);
			}
		},
		[value, onChange],
	);

	const onSelectValue = useCallback(
		(selectedValue: string) => {
			if (value.includes(selectedValue)) {
				onChange(value.filter((v) => v !== selectedValue));
			} else {
				onChange([...value, selectedValue]);
			}
		},
		[value, onChange],
	);

	return {
		allValues,
		onSelectAll,
		onSelectNone,
		onSelectValue,
	};
};
