import { useSettings } from "@ext/enterprise/components/admin/contexts/SettingsContext";
import { useAlertMessage } from "@ext/enterprise/components/admin/hooks/useAlertMessage";
import { toGesErrorCode } from "@ext/enterprise/errors/GesError";
import { getGesErrorBadgeText, getGesErrorTitle, getSaveErrorText } from "@ext/enterprise/errors/getGesErrorText";
import { useCallback, useState } from "react";

interface UseEditorSheetArgs<T> {
	buildChanges: () => T[];
	apply: (changes: T[]) => Promise<void>;
	onClose: () => void;
	validate?: () => boolean | Promise<boolean>;
}

export const useEditorSheet = <T>({ buildChanges, apply, onClose, validate }: UseEditorSheetArgs<T>) => {
	const { gesUrl } = useSettings();
	const [saving, setSaving] = useState(false);
	const saveError = useAlertMessage();
	const [showUnsaved, setShowUnsaved] = useState(false);

	const hasChanges = useCallback(() => buildChanges().length > 0, [buildChanges]);

	const requestClose = useCallback(() => {
		if (hasChanges()) setShowUnsaved(true);
		else onClose();
	}, [hasChanges, onClose]);

	const persist = useCallback(async (): Promise<boolean> => {
		saveError.hide();
		if (validate && !(await validate())) return false;
		const changes = buildChanges();
		if (changes.length === 0) return true;
		setSaving(true);
		try {
			await apply(changes);
			return true;
		} catch (error) {
			const code = toGesErrorCode(error);
			saveError.alert(getSaveErrorText(code, gesUrl), getGesErrorTitle(code), getGesErrorBadgeText(code));
			return false;
		} finally {
			setSaving(false);
		}
	}, [validate, buildChanges, apply, saveError.hide, saveError.alert, gesUrl]);

	const submit = useCallback(async () => {
		if (await persist()) onClose();
	}, [persist, onClose]);

	return {
		saving,
		saveError,
		showUnsaved,
		setShowUnsaved,
		hasChanges,
		requestClose,
		persist,
		submit,
		close: onClose,
	};
};
