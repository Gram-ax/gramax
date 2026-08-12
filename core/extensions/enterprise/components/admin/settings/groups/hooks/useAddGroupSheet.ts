import t from "@ext/localization/locale/translate";
import { useCallback, useEffect, useState } from "react";

interface UseAddGroupSheetArgs {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	existingKeys?: Set<string>;
	onCreate: (id: string) => void;
}

export const useAddGroupSheet = ({ open, onOpenChange, existingKeys, onCreate }: UseAddGroupSheetArgs) => {
	const [value, setValue] = useState("");
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		if (!open) return;
		setValue("");
		setError(null);
	}, [open]);

	const validate = useCallback(() => {
		const id = value.trim();
		if (!id) return t("enterprise.admin.groups.errors.name-required");
		if (existingKeys?.has(id)) return t("enterprise.admin.groups.errors.exists");
		return null;
	}, [value, existingKeys]);

	const handleAdd = useCallback(() => {
		const err = validate();
		if (err) {
			setError(err);
			return;
		}
		onCreate(value.trim());
		onOpenChange(false);
	}, [validate, value, onCreate, onOpenChange]);

	const handleChange = useCallback(
		(v: string) => {
			setValue(v);
			if (error) setError(null);
		},
		[error],
	);

	const handleBlur = useCallback(() => {
		const err = validate();
		setError(err);
	}, [validate]);

	return { value, error, handleBlur, handleChange, handleAdd };
};
