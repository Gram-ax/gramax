import CatalogItem from "@components/Actions/CatalogItems/Base";
import Icon from "@components/Atoms/Icon";
import ModalToOpenService from "@core-ui/ContextServices/ModalToOpenService/ModalToOpenService";
import ModalToOpen from "@core-ui/ContextServices/ModalToOpenService/model/ModalsToOpen";
import t from "@ext/localization/locale/translate";
import { ItemLink } from "@ext/navigation/NavigationLinks";
import { ComponentProps, ReactNode } from "react";
import Healthcheck from "./Healthcheck";

const HealthcheckTrigger = ({ itemLinks, children }: { itemLinks: ItemLink[]; children?: ReactNode }) => {
	const onSelect = () => {
		ModalToOpenService.setValue<ComponentProps<typeof Healthcheck>>(ModalToOpen.Healthcheck, {
			itemLinks,
			onClose: () => {
				ModalToOpenService.resetValue();
			},
		});
	};
	return (
		<CatalogItem
			renderLabel={(Item) => {
				return (
					<Item onSelect={onSelect}>
						<Icon code="heart-pulse" />
						{t("check-errors")}
					</Item>
				);
			}}
		>
			{children}
		</CatalogItem>
	);
};

export default HealthcheckTrigger;
