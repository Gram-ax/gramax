import CatalogItem from "@components/Actions/CatalogItems/Base";
import Icon from "@components/Atoms/Icon";
import ModalToOpenService from "@core-ui/ContextServices/ModalToOpenService/ModalToOpenService";
import ModalToOpen from "@core-ui/ContextServices/ModalToOpenService/model/ModalsToOpen";
import t from "@ext/localization/locale/translate";
import { ComponentProps, ReactNode } from "react";
import CatalogPropsEditor from "./CatalogPropsEditor";

const CatalogPropsTrigger = ({ children }: { children?: ReactNode }) => {
	const onSelect = () => {
		ModalToOpenService.setValue<ComponentProps<typeof CatalogPropsEditor>>(ModalToOpen.CatalogPropsEditor, {
			onClose: () => {
				ModalToOpenService.resetValue();
			},
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
