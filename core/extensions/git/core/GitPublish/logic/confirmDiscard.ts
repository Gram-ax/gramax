import ModalToOpenService from "@core-ui/ContextServices/ModalToOpenService/ModalToOpenService";
import ModalToOpen from "@core-ui/ContextServices/ModalToOpenService/model/ModalsToOpen";
import t from "@ext/localization/locale/translate";
import type { AlertConfirm } from "@ui-kit/AlertDialog";
import type { ComponentProps } from "react";

export const confirmDiscard = async (count: number) => {
	const result = await new Promise<boolean>((resolve) => {
		if (ModalToOpenService.hasValue()) {
			resolve(false);
			return;
		}

		ModalToOpenService.setValue<ComponentProps<typeof AlertConfirm>>(ModalToOpen.AlertConfirm, {
			title: t("git.discard.alert.title"),
			description: t("git.discard.alert.body"),
			cancelText: t("git.discard.alert.buttons.secondary"),
			confirmText: t("git.discard.alert.buttons.primary").replace("{count}", count > 1 ? ` (${count})` : ""),
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
