import ModalToOpenService from "@core-ui/ContextServices/ModalToOpenService/ModalToOpenService";
import ModalToOpen from "@core-ui/ContextServices/ModalToOpenService/model/ModalsToOpen";
import t from "@ext/localization/locale/translate";
import { DropdownMenuItem } from "@ui-kit/Dropdown";
import type { ComponentProps } from "react";
import type NotificationSettingsModal from "./NotificationSettingsModal";

interface NotificationSettingsButtonProps {
	itemRefPath: string;
}

export const NotificationSettingsButton = ({ itemRefPath }: NotificationSettingsButtonProps) => {
	const handleOpenNotificationSettings = () => {
		const modalId = ModalToOpenService.addModal<ComponentProps<typeof NotificationSettingsModal>>(
			ModalToOpen.NotificationSettings,
			{
				initialIsOpen: true,
				onClose: () => ModalToOpenService.removeModal(modalId),
				itemRefPath,
			},
		);
	};

	return <DropdownMenuItem onSelect={handleOpenNotificationSettings}>{t("notifications.settings")}</DropdownMenuItem>;
};
