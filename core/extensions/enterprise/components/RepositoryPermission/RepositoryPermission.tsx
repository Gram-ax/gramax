import CatalogItem from "@components/Actions/CatalogItems/Base";
import Icon from "@components/Atoms/Icon";
import ModalToOpenService from "@core-ui/ContextServices/ModalToOpenService/ModalToOpenService";
import ModalToOpen from "@core-ui/ContextServices/ModalToOpenService/model/ModalsToOpen";
import t from "@ext/localization/locale/translate";
import type { ComponentProps, ReactNode } from "react";
import type RepositoryPermission from "../RepositoryPermission/RepositoryPermissionModal";

const RepositoryPermissionTrigger = ({
	gesUrl,
	catalogName,
	pathName,
	sourceName,
	children,
}: {
	gesUrl: string;
	catalogName: string;
	pathName: string;
	sourceName: string;
	children: ReactNode;
}) => {
	const onClick = () => {
		ModalToOpenService.setValue<ComponentProps<typeof RepositoryPermission>>(ModalToOpen.RepositoryPermission, {
			gesUrl,
			pathName,
			catalogName,
			sourceName,
			onClose: () => ModalToOpenService.resetValue(),
		});
	};

	return (
		<CatalogItem
			renderLabel={(Component) => (
				<Component onSelect={onClick}>
					<Icon code="lock" />
					{t("enterprise.admin.resources.repository-permission")}
				</Component>
			)}
		>
			{children}
		</CatalogItem>
	);
};

export default RepositoryPermissionTrigger;
