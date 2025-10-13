import Icon from "@components/Atoms/Icon";
import { DropdownMenuItem } from "@ui-kit/Dropdown";
import t from "@ext/localization/locale/translate";
import ModalToOpenService from "@core-ui/ContextServices/ModalToOpenService/ModalToOpenService";
import ModalToOpen from "@core-ui/ContextServices/ModalToOpenService/model/ModalsToOpen";
import { ComponentProps } from "react";
import GetSharedTicket from "./GetSharedTicket";

const SharedTicketTrigger = () => {
	const onSelect = () => {
		ModalToOpenService.setValue<ComponentProps<typeof GetSharedTicket>>(ModalToOpen.GetSharedTicket, {
			onClose: () => ModalToOpenService.resetValue(),
		});
	};

	return (
		<DropdownMenuItem onSelect={onSelect}>
			<Icon code="external-link" />
			{t("share.name.catalog")}
		</DropdownMenuItem>
	);
};

export default SharedTicketTrigger;
