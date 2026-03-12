import Icon from "@components/Atoms/Icon";
import { useRouter } from "@core/Api/useRouter";
import ApiUrlCreatorService from "@core-ui/ContextServices/ApiUrlCreator";
import ModalToOpenService from "@core-ui/ContextServices/ModalToOpenService/ModalToOpenService";
import ModalToOpen from "@core-ui/ContextServices/ModalToOpenService/model/ModalsToOpen";
import PageDataContextService from "@core-ui/ContextServices/PageDataContext";
import SignInEnterpriseModal from "@ext/enterprise/components/SignInEnterpriseModal";
import SignInOutEnterprise from "@ext/enterprise/components/SignInOutEnterprise";
import type SignOutEnterprise from "@ext/enterprise/components/SignOutEnterprise";
import t from "@ext/localization/locale/translate";
import type UserInfo from "@ext/security/logic/User/UserInfo";
import {
	Avatar,
	AvatarFallback,
	AvatarLabel,
	AvatarLabelAvatar,
	AvatarLabelDescription,
	AvatarLabelTitle,
} from "@ui-kit/Avatar";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuGroup,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTriggerButton,
} from "@ui-kit/Dropdown";
import type { ComponentProps } from "react";

interface UserAvatarProps {
	logOutComponent: React.ReactNode;
	onLogOutClick?: () => void;
}

const getCode = (user: UserInfo): string => {
	let code = user?.name
		?.split(" ")
		?.filter(Boolean)
		?.map((n) => n[0])
		?.join("");

	if (!code) code = user?.mail?.[0] ?? "";
	if (!code) code = "";

	return code.toUpperCase().slice(0, 2);
};

export const UserAvatar = ({ logOutComponent, onLogOutClick }: UserAvatarProps) => {
	const userInfo = PageDataContextService.value?.userInfo;
	const code = getCode(userInfo);

	return (
		<DropdownMenu>
			<DropdownMenuTriggerButton className="aspect-square rounded-full p-0" variant="ghost">
				<Avatar size="sm">
					{/* <AvatarImage src="https://github.com/shadcn.png" /> */}
					<AvatarFallback uniqueId={userInfo?.mail ?? ""}>{code}</AvatarFallback>
				</Avatar>
			</DropdownMenuTriggerButton>
			<DropdownMenuContent align="end">
				<DropdownMenuGroup>
					<DropdownMenuItem className="pointer-events-none">
						<AvatarLabel size="md">
							<AvatarLabelAvatar>
								{/* <AvatarImage src="https://github.com/shadcn.png" /> */}
								<AvatarFallback>{code}</AvatarFallback>
							</AvatarLabelAvatar>
							<AvatarLabelTitle>{userInfo?.name ?? ""}</AvatarLabelTitle>
							<AvatarLabelDescription>{userInfo?.mail ?? ""}</AvatarLabelDescription>
						</AvatarLabel>
					</DropdownMenuItem>
					<DropdownMenuSeparator />
					<DropdownMenuItem onSelect={onLogOutClick}>{logOutComponent}</DropdownMenuItem>
				</DropdownMenuGroup>
			</DropdownMenuContent>
		</DropdownMenu>
	);
};

const SingInOut = () => {
	const router = useRouter();
	const apiUrlCreator = ApiUrlCreatorService.value;
	const pageDataContext = PageDataContextService.value;

	const isLogged = pageDataContext.isLogged;
	const isReadOnly = pageDataContext.conf.isReadOnly;
	const enterprise = pageDataContext.conf.enterprise;
	const workspaceContext = pageDataContext.workspace;
	const currentWorkspaceName = pageDataContext.workspace.current;

	const showEnterpriseSignIn = enterprise.gesUrl && !isReadOnly;
	const authUrl = apiUrlCreator.getAuthUrl(router, isLogged).toString();
	const workspaceConfig = workspaceContext.workspaces.find(
		(workspaceConfig) => workspaceConfig.path === currentWorkspaceName,
	);

	const onLogoutClick = () => {
		ModalToOpenService.setValue<ComponentProps<typeof SignOutEnterprise>>(ModalToOpen.EnterpriseLogout, {
			workspaceConfig,
			onClose: () => ModalToOpenService.resetValue(),
		});
	};

	if (showEnterpriseSignIn) {
		return <SignInOutEnterprise onLogoutClick={onLogoutClick} workspaceConfig={workspaceConfig} />;
	}

	if (isReadOnly && isLogged) {
		return (
			<UserAvatar
				logOutComponent={
					<a className="flex items-center gap-2 w-full" data-qa="qa-clickable" href={authUrl}>
						<Icon code="log-out" />
						{t("sing-out")}
					</a>
				}
			/>
		);
	}

	if (isReadOnly && enterprise.gesUrl) {
		return <SignInEnterpriseModal authUrl={authUrl} />;
	}
};

export default SingInOut;
