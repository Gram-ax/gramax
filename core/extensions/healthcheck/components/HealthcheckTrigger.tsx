import ModalToOpenService from "@core-ui/ContextServices/ModalToOpenService/ModalToOpenService";
import ModalToOpen from "@core-ui/ContextServices/ModalToOpenService/model/ModalsToOpen";
import { ComponentProps } from "react";
import Healthcheck from "./Healthcheck";
import Icon from "@components/Atoms/Icon";
import { DropdownMenuItem } from "@ui-kit/Dropdown";
import t from "@ext/localization/locale/translate";
import { ItemLink } from "@ext/navigation/NavigationLinks";

const HealthcheckTrigger = ({ itemLinks }: { itemLinks: ItemLink[] }) => {
	const onSelect = () => {
		ModalToOpenService.setValue<ComponentProps<typeof Healthcheck>>(ModalToOpen.Healthcheck, {
			itemLinks,
			onClose: () => {
				ModalToOpenService.resetValue();
			},
		});
	};
	return (
		<DropdownMenuItem onSelect={onSelect}>
			<Icon code="heart-pulse" />
			{t("check-errors")}
		</DropdownMenuItem>
	);
};

export default HealthcheckTrigger;
