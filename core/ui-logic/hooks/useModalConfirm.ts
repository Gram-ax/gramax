import { useEventEmitter } from "@core/utils/eventEmitter";
import { ConfirmProps } from "@ext/workspace/components/EditWorkspace";
import { useState, useCallback, useEffect, useRef } from "react";

export interface EmitterAction {
	saveAction: () => void;
}

export const useModalConfirm = (): ConfirmProps => {
	const [isOpenConfirm, setIsOpenConfirm] = useState(false);
	const [haveChanges, setHaveChanges] = useState(false);

	const eventEmitter = useEventEmitter<EmitterAction>();

	const useSaveCallback = useRef((callback: () => any) => {
		useEffect(() => {
			eventEmitter.on("saveAction", callback);

			return () => {
				eventEmitter.off("saveAction", callback);
			};
		}, [callback]);
	});

	const saveCallback = useCallback(() => {
		eventEmitter.emit("saveAction");
	}, [eventEmitter]);

	const shouldOpenConfirmOnClose = useCallback(() => {
		if (haveChanges) {
			setIsOpenConfirm(true);
			return true;
		}
		return false;
	}, [haveChanges]);

	const closeConfirm = useCallback(() => {
		setIsOpenConfirm(false);
	}, []);

	const clearData = useCallback(() => {
		setHaveChanges(false);
		setIsOpenConfirm(false);
	}, []);

	return {
		clearData,
		setHaveChanges,
		saveChangesHandler: saveCallback,
		isOpenConfirm,
		useSaveCallback: useSaveCallback.current,
		shouldOpenConfirmOnClose,
		closeConfirm,
	};
};
