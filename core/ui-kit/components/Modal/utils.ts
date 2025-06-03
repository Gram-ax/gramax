import { MouseEvent, KeyboardEvent } from "react";

export function isFromModal(e: MouseEvent | KeyboardEvent) {
	const path = (e.nativeEvent as any).composedPath?.() as HTMLElement[] | undefined;
	if (Array.isArray(path)) {
		return path.some((el) => el?.dataset?.modalRoot !== undefined);
	}

	const isModal = (e.target as HTMLElement).closest("[data-modal-root]") !== null;
	const insideModal = (e.target as HTMLElement).closest("[data-modal-content]") !== null;

	return isModal || insideModal;
}
