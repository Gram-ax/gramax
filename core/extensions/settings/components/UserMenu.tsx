import Icon from "@components/Atoms/Icon";
import { useRouter } from "@core/Api/useRouter";
import ApiUrlCreatorService from "@core-ui/ContextServices/ApiUrlCreator";
import ModalToOpenService from "@core-ui/ContextServices/ModalToOpenService/ModalToOpenService";
import ModalToOpen from "@core-ui/ContextServices/ModalToOpenService/model/ModalsToOpen";
import PageDataContextService from "@core-ui/ContextServices/PageDataContext";
import { usePlatform } from "@core-ui/hooks/usePlatform";
import useDesktopEnterpriseSession from "@ext/enterprise/components/SingInOut/hooks/useDesktopEnterpriseSession";
import useSignOut from "@ext/enterprise/components/SingInOut/hooks/useSignOut";
import { useEnterpriseSignIn } from "@ext/enterprise/components/SingInOut/SignInEnterprise";
import type SignOutGesCloud from "@ext/enterprise-cloud/components/SignInOut/GesCloudSignOutModal";
import t from "@ext/localization/locale/translate";
import { Level } from "@ext/settings/logic/settings";
import { feature } from "@ext/toggleFeatures/features";
import {
	Avatar,
	AvatarFallback,
	AvatarLabel,
	AvatarLabelAvatar,
	AvatarLabelDescription,
	AvatarLabelTitle,
	getAvatarFallback,
} from "@ui-kit/Avatar";
import { IconButton } from "@ui-kit/Button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuGroup,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTriggerButton,
} from "@ui-kit/Dropdown";
import { Tooltip, TooltipContent, TooltipTrigger } from "@ui-kit/Tooltip";
import { type ComponentProps, useCallback } from "react";
import { openAppSettings } from "./AppSettingsTrigger";

const UserMenu = () => {
	const { isWeb, isTauri } = usePlatform();
	const router = useRouter();
	const apiUrlCreator = ApiUrlCreatorService.value;
	const pageDataContext = PageDataContextService.value;
	const { isCurrentEnterpriseSession, shouldOpenTauriGesModal } = useDesktopEnterpriseSession();
	const { onLogoutClick, canLogoutEnterprise } = useSignOut();
	const userInfo = pageDataContext?.userInfo;
	const gesUrl = pageDataContext?.conf?.activeGesUrl;
	const isGesCloudEnabled = feature("ges-cloud");
	const isGesCloudLoggedIn = Boolean(isGesCloudEnabled && pageDataContext?.isLogged && !isCurrentEnterpriseSession);
	const isLogged = !!isCurrentEnterpriseSession || isGesCloudLoggedIn;
	// Sign-in entry is shown only where it actually applies (enterprise endpoint
	// available, or a Tauri GES sign-in modal). Plain OSS/static have none.
	const canSignIn = !!gesUrl || (isTauri && shouldOpenTauriGesModal);
	const canSignInGesCloud = isTauri && isGesCloudEnabled && !pageDataContext?.isLogged;
	const currentWorkspaceName = pageDataContext.workspace.current;
	const workspaceConfig = pageDataContext.workspace.workspaces.find(
		(workspace) => workspace.path === currentWorkspaceName,
	);

	const enterpriseSignIn = useEnterpriseSignIn({ gesUrl, isWeb, isTauri, apiUrlCreator, router });

	const handleSignIn = async () => {
		if (isTauri && shouldOpenTauriGesModal) {
			ModalToOpenService.setValue(ModalToOpen.TauriGesSignIn);
			return;
		}
		if (!gesUrl) return;
		await enterpriseSignIn();
	};

	const handleGesCloudSignIn = useCallback(() => {
		const modalId = ModalToOpenService.addModal(ModalToOpen.GesCloudUrl, {
			onClose: () => ModalToOpenService.removeModal(modalId),
		});
	}, []);

	const handleGesCloudLogout = useCallback(() => {
		if (!workspaceConfig) return;
		const modalId = ModalToOpenService.addModal<ComponentProps<typeof SignOutGesCloud>>(
			ModalToOpen.GesCloudSignOut,
			{
				workspaceConfig,
				onClose: () => ModalToOpenService.removeModal(modalId),
			},
		);
	}, [workspaceConfig]);

	const openSettings = () => openAppSettings(Level.app);

	const fallback = getCode(userInfo?.name, userInfo?.mail);

	return (
		<DropdownMenu>
			<Tooltip>
				<TooltipContent>
					<p>{isLogged ? (userInfo?.name ?? t("account")) : t("account")}</p>
				</TooltipContent>
				<TooltipTrigger asChild>
					<DropdownMenuTriggerButton className="aspect-square p-0" variant="ghost">
						{isLogged ? (
							<Avatar size="sm">
								<AvatarFallback uniqueId={userInfo?.mail ?? ""}>{fallback}</AvatarFallback>
							</Avatar>
						) : (
							<IconButton
								className="p-2"
								icon="user-round"
								iconClassName="w-5 h-5 stroke-[1.6]"
								size="lg"
								variant="ghost"
							/>
						)}
					</DropdownMenuTriggerButton>
				</TooltipTrigger>
			</Tooltip>
			<DropdownMenuContent align="end">
				<DropdownMenuGroup>
					{isLogged && (
						<>
							<DropdownMenuItem className="pointer-events-none">
								<AvatarLabel size="md">
									<AvatarLabelAvatar>
										<AvatarFallback>{fallback}</AvatarFallback>
									</AvatarLabelAvatar>
									<AvatarLabelTitle>{userInfo?.name ?? ""}</AvatarLabelTitle>
									<AvatarLabelDescription>{userInfo?.mail ?? ""}</AvatarLabelDescription>
								</AvatarLabel>
							</DropdownMenuItem>
							<DropdownMenuSeparator />
						</>
					)}
					{!isLogged && canSignIn && (
						<DropdownMenuItem onSelect={handleSignIn}>
							<Icon code="log-in" />
							{t("sing-in")}
						</DropdownMenuItem>
					)}
					{!isLogged && canSignInGesCloud && (
						<DropdownMenuItem onSelect={handleGesCloudSignIn}>
							<Icon code="cloud" />
							{t("sing-in")}
						</DropdownMenuItem>
					)}
					<DropdownMenuItem onSelect={openSettings}>
						<Icon code="settings" />
						{t("app-settings.title")}
					</DropdownMenuItem>
					{isLogged && (canLogoutEnterprise || isGesCloudLoggedIn) && (
						<>
							<DropdownMenuSeparator />
							<DropdownMenuItem onSelect={canLogoutEnterprise ? onLogoutClick : handleGesCloudLogout}>
								<Icon code="log-out" />
								{t("sing-out")}
							</DropdownMenuItem>
						</>
					)}
				</DropdownMenuGroup>
			</DropdownMenuContent>
		</DropdownMenu>
	);
};

const getCode = (name?: string, mail?: string): string => {
	let code = getAvatarFallback(name ?? "");
	if (!code) code = mail?.[0] ?? "";
	return (code ?? "").toUpperCase();
};

export default UserMenu;
