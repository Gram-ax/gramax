import ModalToOpenService from "@core-ui/ContextServices/ModalToOpenService/ModalToOpenService";
import ModalToOpen from "@core-ui/ContextServices/ModalToOpenService/model/ModalsToOpen";
import PageDataContextService from "@core-ui/ContextServices/PageDataContext";
import type SignOutGesCloud from "@ext/enterprise-cloud/components/SignInOut/GesCloudSignOutModal";
import t from "@ext/localization/locale/translate";
import { IconButton } from "@ui-kit/Button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@ui-kit/Tooltip";
import { type ComponentProps, useCallback } from "react";
import { SignOut, UserAvatar } from "../../../../components/UserAvatar";

export const GesCloudSignInOut = () => {
	const isLogged = PageDataContextService.value.isLogged;

	const { enabled } = PageDataContextService.value.conf.enterpriseCloud;

	if (isLogged) return <GesCloudSignOut />;

	if (enabled) return null;

	return <GesCloudSignInButton />;
};

export const GesCloudTauriSignInOut = () => {
	const isLogged = PageDataContextService.value.isLogged;

	if (isLogged) return <GesCloudSignOut />;

	return <GesCloudSignInButton overrideIcon="cloud" withUrlStep />;
};

const GesCloudSignOut = () => {
	const pageDataContext = PageDataContextService.value;
	const workspaceContext = pageDataContext.workspace;
	const currentWorkspaceName = pageDataContext.workspace.current;

	const workspaceConfig = workspaceContext.workspaces.find(
		(workspaceConfig) => workspaceConfig.path === currentWorkspaceName,
	);

	const onLogoutClick = useCallback(() => {
		const id = ModalToOpenService.addModal<ComponentProps<typeof SignOutGesCloud>>(ModalToOpen.GesCloudSignOut, {
			workspaceConfig,
			onClose: () => ModalToOpenService.removeModal(id),
		});
	}, [workspaceConfig]);

	return <UserAvatar logoutComponent={<SignOut />} onLogoutClick={onLogoutClick} />;
};

interface GesCloudSignInButtonProps {
	overrideIcon?: string;
	withUrlStep?: boolean;
}

const GesCloudSignInButton = (props: GesCloudSignInButtonProps) => {
	const { url: gesCloudUrl } = PageDataContextService.value.conf.enterpriseCloud;

	const onClick = () => {
		if (props.withUrlStep) {
			const modalId = ModalToOpenService.addModal(ModalToOpen.GesCloudUrl, {
				onClose: () => ModalToOpenService.removeModal(modalId),
			});
			return;
		}

		const modalId = ModalToOpenService.addModal(ModalToOpen.GesCloudSignIn, {
			gesCloudUrl,
			allowContinueWithoutAccount: false,
			onClose: () => ModalToOpenService.removeModal(modalId),
		});
	};

	return (
		<Tooltip>
			<TooltipContent>
				<p>{t("sing-in")}</p>
			</TooltipContent>
			<TooltipTrigger asChild>
				<IconButton
					className="p-2"
					icon={props.overrideIcon || "user-round"}
					iconClassName="w-5 h-5 stroke-[1.6]"
					onClick={onClick}
					size="lg"
					variant="ghost"
				/>
			</TooltipTrigger>
		</Tooltip>
	);
};
