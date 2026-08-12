import ModalToOpenService from "@core-ui/ContextServices/ModalToOpenService/ModalToOpenService";
import ModalToOpen from "@core-ui/ContextServices/ModalToOpenService/model/ModalsToOpen";
import t from "@ext/localization/locale/translate";
import { type ComponentProps, useCallback } from "react";
import type { AlertConfirm } from "../../../../../ui-kit/components/AlertDialog";

export const useOpenStorageNotConnectedModal = () => {
	return useCallback(() => {
		ModalToOpenService.resetValue();
		ModalToOpenService.setValue<ComponentProps<typeof AlertConfirm>>(ModalToOpen.AlertConfirm, {
			description: t("forms.clone-repo.errors.connect"),
			icon: "alert-circle",
			status: "error",
			title: t("forms.add-storage.name2"),
			onCancel: () => ModalToOpenService.resetValue(),
			cancelText: t("close"),
		});
	}, []);
};
