import Icon from "@components/Atoms/Icon";
import { DropdownMenuItem } from "@ui-kit/Dropdown";
import t from "@ext/localization/locale/translate";
import ModalToOpenService from "@core-ui/ContextServices/ModalToOpenService/ModalToOpenService";
import ModalToOpen from "@core-ui/ContextServices/ModalToOpenService/model/ModalsToOpen";
import { ComponentProps, ReactNode, useEffect, useState } from "react";
import { RequestStatus, useApi } from "@core-ui/hooks/useApi";
import PermissionService from "@ext/security/logic/Permission/components/PermissionService";
import Workspace from "@core-ui/ContextServices/Workspace";
import { editCatalogPermission } from "@ext/security/logic/Permission/Permissions";
import { useCatalogPropsStore } from "@core-ui/stores/CatalogPropsStore/CatalogPropsStore.provider";
import GetSharedTicket from "@ext/security/logic/TicketManager/components/GetSharedTicket";
import CatalogItem from "@components/Actions/CatalogItems/Base";

interface SharedTicketTriggerProps {
	children?: ReactNode;
}

const SharedTicketTrigger = ({ children }: SharedTicketTriggerProps) => {
	const workspacePath = Workspace.current().path;
	const catalogName = useCatalogPropsStore((state) => state.data?.name);
	const [groups, setGroups] = useState(null);
	const { call: fetchGroups, status } = useApi<string[]>({
		url: (api) => api.getPermissionValuesUrl(),
	});

	useEffect(() => {
		const loadGroups = async () => {
			const res = await fetchGroups();
			if (!res) return;
			setGroups(res);
		};

		loadGroups();
	}, []);

	const canEditCatalog = PermissionService.useCheckPermission(editCatalogPermission, workspacePath, catalogName);
	if (!groups?.length || !canEditCatalog) return null;

	const onSelect = () => {
		ModalToOpenService.setValue<ComponentProps<typeof GetSharedTicket>>(ModalToOpen.GetSharedTicket, {
			groups: groups,
			onClose: () => ModalToOpenService.resetValue(),
		});
	};

	return (
		<CatalogItem
			renderLabel={(Component) => (
				<Component onSelect={onSelect} disabled={status !== RequestStatus.Ready}>
					<Icon code="external-link" />
					{t("share.name.catalog")}
				</Component>
			)}
		>
			{children}
		</CatalogItem>
	);
};

export default SharedTicketTrigger;
