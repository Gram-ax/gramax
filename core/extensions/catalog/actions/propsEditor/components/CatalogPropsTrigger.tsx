import CatalogItem from "@components/Actions/CatalogItems/Base";
import Icon from "@components/Atoms/Icon";
import ModalToOpenService from "@core-ui/ContextServices/ModalToOpenService/ModalToOpenService";
import ModalToOpen from "@core-ui/ContextServices/ModalToOpenService/model/ModalsToOpen";
import t from "@ext/localization/locale/translate";
import { Level } from "@ext/settings/logic/settings";
import type { ReactNode } from "react";

const CatalogPropsTrigger = ({ children }: { children?: ReactNode }) => {
	const onSelect = () => {
		ModalToOpenService.setValue(ModalToOpen.AppSettings, {
			defaultLevel: Level.catalog,
			onClose: () => ModalToOpenService.resetValue(),
		});
	};

	return (
		<CatalogItem
			renderLabel={(Component) => (
				<Component onSelect={onSelect}>
					<Icon code="square-pen" />
					{t("catalog.configure")}
				</Component>
			)}
		>
			{children}
		</CatalogItem>
	);
};

export default CatalogPropsTrigger;
