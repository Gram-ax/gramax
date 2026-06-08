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
	const pageDataContext = PageDataContextService.value;
	const isLogged = pageDataContext.isLogged;
	const workspaceContext = pageDataContext.workspace;
	const currentWorkspaceName = pageDataContext.workspace.current;

	const workspaceConfig = workspaceContext.workspaces.find(
		(workspaceConfig) => workspaceConfig.path === currentWorkspaceName,
	);
	const { url: gesCloudUrl, enabled } = PageDataContextService.value.conf.enterpriseCloud;

	const onLogoutClick = useCallback(() => {
		const id = ModalToOpenService.addModal<ComponentProps<typeof SignOutGesCloud>>(ModalToOpen.GesCloudSignOut, {
			workspaceConfig,
			onClose: () => ModalToOpenService.removeModal(id),
		});
	}, [workspaceConfig]);

	if (isLogged) return <UserAvatar logoutComponent={<SignOut />} onLogoutClick={onLogoutClick} />;

	if (enabled) return null;

	return (
		<Tooltip>
			<TooltipContent>
				<p>{t("sing-in")}</p>
			</TooltipContent>
			<TooltipTrigger asChild>
				<IconButton
					className="p-2"
					icon={"user-round"}
					iconClassName="w-5 h-5 stroke-[1.6]"
					onClick={() => {
						const modalId = ModalToOpenService.addModal(ModalToOpen.GesCloudSignIn, {
							gesCloudUrl,
							allowContinueWithoutAccount: false,
							onClose: () => ModalToOpenService.removeModal(modalId),
						});
					}}
					size="lg"
					variant="ghost"
				/>
			</TooltipTrigger>
		</Tooltip>
	);
};
