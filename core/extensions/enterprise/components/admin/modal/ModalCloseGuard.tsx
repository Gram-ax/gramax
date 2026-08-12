import { useAdminNavigation } from "@ext/enterprise/components/admin/contexts/AdminNavigationContext";
import { useGuard } from "@ext/enterprise/components/admin/contexts/GuardProvider";
import { useCallback, useEffect } from "react";

export const ModalCloseGuard = ({
	children,
	onRequestClose,
	guardedCloseRef,
}: {
	children: React.ReactNode;
	onRequestClose: () => void;
	guardedCloseRef: React.MutableRefObject<(() => void) | null>;
}) => {
	const { page } = useAdminNavigation();
	const { getGuard, showUnsavedChangesModal } = useGuard();

	const handleClose = useCallback(() => {
		const guard = getGuard(page);
		if (guard?.hasChanges()) {
			showUnsavedChangesModal(guard, onRequestClose, onRequestClose);
		} else {
			onRequestClose();
		}
	}, [page, getGuard, showUnsavedChangesModal, onRequestClose]);

	useEffect(() => {
		guardedCloseRef.current = handleClose;
		return () => {
			guardedCloseRef.current = null;
		};
	}, [handleClose, guardedCloseRef]);

	return <>{children}</>;
};
