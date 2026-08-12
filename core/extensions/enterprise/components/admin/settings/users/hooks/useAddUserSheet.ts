import validateEmail from "@core/utils/validateEmail";
import { emailKey } from "@ext/enterprise/components/admin/settings/members/model/Member";
import t from "@ext/localization/locale/translate";
import { useCallback, useEffect, useState } from "react";

interface UseAddUserSheetArgs {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	existingKeys?: Set<string>;
	onCreate: (value: string) => void;
}

export const useAddUserSheet = ({ open, onOpenChange, existingKeys, onCreate }: UseAddUserSheetArgs) => {
	const [value, setValue] = useState("");
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		if (!open) return;
		setValue("");
		setError(null);
	}, [open]);

	const validate = useCallback(() => {
		const id = value.trim();
		if (!id) return t("enterprise.admin.errors.email-required");
		if (!validateEmail(id)) return t("enterprise.admin.errors.email-invalid");
		if (existingKeys?.has(emailKey(id))) return t("enterprise.admin.users.errors.exists");
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
