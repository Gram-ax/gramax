import Icon from "@components/Atoms/Icon";
import ModalToOpenService from "@core-ui/ContextServices/ModalToOpenService/ModalToOpenService";
import ModalToOpen from "@core-ui/ContextServices/ModalToOpenService/model/ModalsToOpen";
import t from "@ext/localization/locale/translate";
import { DropdownMenuItem } from "@ui-kit/Dropdown";
import { ComponentProps } from "react";
import BugsnagModal from "./BugsnagModal";

const BugsnagTrigger = ({ itemLogicPath }: { itemLogicPath: string }) => {
	const onSelect = () => {
		ModalToOpenService.setValue<ComponentProps<typeof BugsnagModal>>(ModalToOpen.BugsnagModal, {
			itemLogicPath,
			onClose: () => {
				ModalToOpenService.resetValue();
			},
		});
	};

	return (
		<DropdownMenuItem onSelect={onSelect}>
			<Icon code="bug" />
			{t("bug-report.name")}
		</DropdownMenuItem>
	);
};

export default BugsnagTrigger;
