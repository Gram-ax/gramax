import ModalToOpenService from "@core-ui/ContextServices/ModalToOpenService/ModalToOpenService";
import ModalToOpen from "@core-ui/ContextServices/ModalToOpenService/model/ModalsToOpen";
import t from "@ext/localization/locale/translate";
import type { AlertConfirm } from "@ui-kit/AlertDialog";
import type { ComponentProps } from "react";

export const confirmCommentClose = async () => {
	const result = await new Promise<boolean>((resolve) => {
		if (ModalToOpenService.hasValue()) {
			resolve(false);
			return;
		}

		ModalToOpenService.setValue<ComponentProps<typeof AlertConfirm>>(ModalToOpen.AlertConfirm, {
			title: t("confirmation.unsaved-comment.title"),
			description: t("confirmation.unsaved-comment.body"),
			cancelText: t("confirmation.unsaved-comment.buttons.primary"),
			confirmText: t("confirmation.unsaved-comment.buttons.secondary"),
			status: "error",
			icon: "triangle-alert",
			onConfirm: () => {
				resolve(true);
				ModalToOpenService.resetValue();
			},
			onCancel: () => {
				resolve(false);
				ModalToOpenService.resetValue();
			},
		});
	});

	return result;
};
