import Icon from "@components/Atoms/Icon";
import { DropdownMenuItem } from "@ui-kit/Dropdown";
import t from "@ext/localization/locale/translate";
import ModalToOpenService from "@core-ui/ContextServices/ModalToOpenService/ModalToOpenService";
import ModalToOpen from "@core-ui/ContextServices/ModalToOpenService/model/ModalsToOpen";
import BugsnagModal from "./BugsnagModal";
import { ComponentProps } from "react";

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
