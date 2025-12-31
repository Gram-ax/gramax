import { Page } from "@ext/enterprise/types/EnterpriseAdmin";
import { useCallback, useEffect, useRef } from "react";
import { useGuard } from "./useGuard";

interface UseTabGuardOptions {
	page: Page;
	hasChanges: () => boolean;
	onSave: () => Promise<void>;
	onDiscard: () => void;
}

export const useTabGuard = ({ page, hasChanges, onSave, onDiscard }: UseTabGuardOptions) => {
	const { register, unregister } = useGuard();

	const hasChangesRef = useRef(hasChanges);
	const onSaveRef = useRef(onSave);
	const onDiscardRef = useRef(onDiscard);

	useEffect(() => {
		hasChangesRef.current = hasChanges;
		onSaveRef.current = onSave;
		onDiscardRef.current = onDiscard;
	}, [hasChanges, onSave, onDiscard]);

	const hasUnsavedChanges = useCallback(() => {
		return hasChangesRef.current();
	}, []);

	const handleDiscard = useCallback(() => {
		onDiscardRef.current();
	}, []);

	useEffect(() => {
		register(page, {
			hasChanges: hasUnsavedChanges,
			onSave: () => onSaveRef.current(),
			onDiscard: handleDiscard,
		});

		return () => unregister(page);
	}, [page, register, unregister, hasUnsavedChanges, handleDiscard]);

	return {
		hasUnsavedChanges,
		discardChanges: handleDiscard,
	};
};
