import { topMenuItemClassName } from "@components/HomePage/TopMenu/const";
import { classNames } from "@components/libs/classNames";
import isMobileService from "@core-ui/ContextServices/isMobileService";
import ModalToOpenService from "@core-ui/ContextServices/ModalToOpenService/ModalToOpenService";
import ModalToOpen from "@core-ui/ContextServices/ModalToOpenService/model/ModalsToOpen";
import { relocateToUrl } from "@ext/enterprise/components/SingInOut/hooks/useSignIn";
import type { OrganizationInfo } from "@ext/enterprise-cloud/GesCloudApi";
import { useGesCloudOrganizationStore } from "@ext/enterprise-cloud/ui-logic/stores/GesCloudOrganizationStore/GesCloudOrganizationStore.provider";
import t from "@ext/localization/locale/translate";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuGroup,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTriggerButton,
} from "@ui-kit/Dropdown";
import { Icon } from "@ui-kit/Icon";
import { MenuItemInteractiveTemplate } from "@ui-kit/MenuItem";
import { useState } from "react";

interface OrganizationListProps {
	setDropdownOpen: (open: boolean) => void;
	organizations: OrganizationInfo[];
	isLoading: boolean;
	error: string | null;
}

const OrganizationList = ({ setDropdownOpen, organizations, isLoading, error }: OrganizationListProps) => {
	if (isLoading) {
		return (
			<DropdownMenuItem disabled>
				<Icon icon="loader" />
				{t("enterprise-cloud.organization.loading")}
			</DropdownMenuItem>
		);
	}

	if (error) {
		return (
			<DropdownMenuItem disabled>
				<Icon icon="alert-circle" />
				{t("enterprise-cloud.organization.error-loading")}
			</DropdownMenuItem>
		);
	}

	const currentOrganization = organizations.find((org) => org.current);
	const otherOrganizations = organizations.filter((org) => !org.current);

	return (
		<>
			{currentOrganization && (
				<>
					<DropdownMenuItem data-qa="qa-clickable" onClick={() => void 0}>
						<MenuItemInteractiveTemplate
							buttonDisabled={!currentOrganization.canEdit}
							buttonIcon={currentOrganization.canEdit ? "pen" : "pen-off"}
							buttonOnClick={() => {
								setDropdownOpen(false);
								const id = ModalToOpenService.addModal(ModalToOpen.GesCloudOrganizationSettings, {
									onClose: () => ModalToOpenService.removeModal(id),
								});
							}}
							disabledTooltip={
								!currentOrganization.canEdit ? t("enterprise-cloud.org-settings.cant-edit") : undefined
							}
							icon="building"
							isSelected={true}
							text={currentOrganization.name}
						/>
					</DropdownMenuItem>
					{otherOrganizations.length > 0 && <DropdownMenuSeparator />}
				</>
			)}
			{otherOrganizations.map((organization) => (
				<DropdownMenuItem
					data-qa="qa-clickable"
					key={organization.id}
					onClick={() => {
						setDropdownOpen(false);
						relocateToUrl(organization.url);
					}}
				>
					<Icon icon="building" />
					{organization.name}
				</DropdownMenuItem>
			))}
		</>
	);
};

interface SwitchWorkspaceTriggerProps {
	currentOrganization?: OrganizationInfo;
	isLoading: boolean;
}

const SwitchWorkspaceTrigger = ({ currentOrganization, isLoading }: SwitchWorkspaceTriggerProps) => {
	const isMobile = isMobileService.value;

	if (isLoading || !currentOrganization) {
		return (
			<DropdownMenuTriggerButton
				className={classNames("relative aspect-square p-2", {}, [topMenuItemClassName])}
				data-qa="qa-clickable"
				data-testid="switch-workspace"
				size="lg"
				variant="ghost"
			>
				<Icon icon="loader" />
			</DropdownMenuTriggerButton>
		);
	}

	return isMobile ? (
		<DropdownMenuTriggerButton
			className={classNames("relative aspect-square p-2", {}, [topMenuItemClassName])}
			data-qa="qa-clickable"
			data-testid="switch-workspace"
			size="lg"
			variant="ghost"
		>
			<Icon icon="building" />
		</DropdownMenuTriggerButton>
	) : (
		<DropdownMenuTriggerButton
			className={classNames("relative pl-3 pr-2", {}, [topMenuItemClassName])}
			data-qa="qa-clickable"
			data-testid="switch-workspace"
			variant="ghost"
		>
			<Icon icon="building" />
			{currentOrganization.name}
			<Icon icon="chevrons-up-down" />
		</DropdownMenuTriggerButton>
	);
};

export const GesCloudSwitchOrganization = () => {
	const [dropdownOpen, setDropdownOpen] = useState(false);
	const { organizations, isLoading, error } = useGesCloudOrganizationStore((state) => ({
		organizations: state.organizations,
		isLoading: state.isLoading,
		error: state.error,
	}));
	const currentOrganization = organizations.find((org) => org.current);

	return (
		<DropdownMenu onOpenChange={setDropdownOpen} open={dropdownOpen}>
			<SwitchWorkspaceTrigger currentOrganization={currentOrganization} isLoading={isLoading} />
			<DropdownMenuContent align="start">
				<DropdownMenuGroup>
					<OrganizationList
						error={error}
						isLoading={isLoading}
						organizations={organizations}
						setDropdownOpen={setDropdownOpen}
					/>
				</DropdownMenuGroup>
			</DropdownMenuContent>
		</DropdownMenu>
	);
};
