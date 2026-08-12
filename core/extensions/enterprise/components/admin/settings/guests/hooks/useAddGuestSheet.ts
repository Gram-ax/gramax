import validateEmail from "@core/utils/validateEmail";
import { emailKey } from "@ext/enterprise/components/admin/settings/members/model/Member";
import t from "@ext/localization/locale/translate";
import { useCallback, useEffect, useState } from "react";

interface UseAddGuestSheetArgs {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	existingKeys?: Set<string>;
	onCreate: (value: string) => void;
	whitelistEnabled?: boolean;
	domains?: string[];
}

export const useAddGuestSheet = ({
	open,
	onOpenChange,
	existingKeys,
	onCreate,
	whitelistEnabled,
	domains,
}: UseAddGuestSheetArgs) => {
	const [value, setValue] = useState("");
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		if (!open) return;
		setValue("");
		setError(null);
	}, [open]);

	const validate = useCallback(() => {
		const trimmed = value.trim();
		if (!trimmed) return t("enterprise.admin.errors.email-required");
		if (!validateEmail(trimmed)) return t("enterprise.admin.errors.email-invalid");
		if (existingKeys?.has(emailKey(trimmed))) return t("enterprise.admin.users.errors.exists");
		if (whitelistEnabled) {
			const domain = trimmed.split("@")[1]?.toLowerCase();
			if (domain && !(domains ?? []).some((d) => d.toLowerCase() === domain)) {
				return t("enterprise.admin.guests.errors.domain-not-allowed");
			}
		}
		return null;
	}, [value, existingKeys, whitelistEnabled, domains]);

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
