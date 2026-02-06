import CatalogItem from "@components/Actions/CatalogItems/Base";
import Icon from "@components/Atoms/Icon";
import ModalToOpenService from "@core-ui/ContextServices/ModalToOpenService/ModalToOpenService";
import ModalToOpen from "@core-ui/ContextServices/ModalToOpenService/model/ModalsToOpen";
import Workspace from "@core-ui/ContextServices/Workspace";
import { RequestStatus, useApi } from "@core-ui/hooks/useApi";
import { useCatalogPropsStore } from "@core-ui/stores/CatalogPropsStore/CatalogPropsStore.provider";
import t from "@ext/localization/locale/translate";
import PermissionService from "@ext/security/logic/Permission/components/PermissionService";
import { editCatalogPermission } from "@ext/security/logic/Permission/Permissions";
import GetSharedTicket from "@ext/security/logic/TicketManager/components/GetSharedTicket";
import { DropdownMenuItem } from "@ui-kit/Dropdown";
import { ComponentProps, ReactNode, useEffect, useState } from "react";

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
				<Component disabled={status !== RequestStatus.Ready} onSelect={onSelect}>
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
