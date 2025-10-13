import Icon from "@components/Atoms/Icon";
import ApiUrlCreatorService from "@core-ui/ContextServices/ApiUrlCreator";
import PageDataContextService from "@core-ui/ContextServices/PageDataContext";
import { useRouter } from "@core/Api/useRouter";
import SignInEnterpriseModal from "@ext/enterprise/components/SignInEnterpriseModal";
import SignInOutEnterprise from "@ext/enterprise/components/SignInOutEnterprise";
import t from "@ext/localization/locale/translate";
import { DropdownMenu, DropdownMenuContent } from "@ui-kit/Dropdown";
import {
	Avatar,
	AvatarFallback,
	AvatarLabel,
	AvatarLabelAvatar,
	AvatarLabelDescription,
	AvatarLabelTitle,
} from "@ui-kit/Avatar";
import {
	DropdownMenuGroup,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTriggerButton,
} from "@ui-kit/Dropdown";
import ModalToOpenService from "@core-ui/ContextServices/ModalToOpenService/ModalToOpenService";
import ModalToOpen from "@core-ui/ContextServices/ModalToOpenService/model/ModalsToOpen";
import { ComponentProps } from "react";
import SignOutEnterprise from "@ext/enterprise/components/SignOutEnterprise";

interface UserAvatarProps {
	logOutComponent: React.ReactNode;
	onLogOutClick?: () => void;
}

export const UserAvatar = ({ logOutComponent, onLogOutClick }: UserAvatarProps) => {
	const pageDataContext = PageDataContextService.value;
	const userInfo = pageDataContext?.userInfo;

	const code =
		userInfo?.name
			?.split(" ")
			?.map((name) => name[0])
			?.join("")
			?.toUpperCase() ||
		userInfo?.mail?.[0]?.toUpperCase() ||
		"";

	return (
		<DropdownMenu>
			<DropdownMenuTriggerButton variant="ghost" className="aspect-square rounded-full p-0">
				<Avatar size="sm">
					{/* <AvatarImage src="https://github.com/shadcn.png" /> */}
					<AvatarFallback>{code}</AvatarFallback>
				</Avatar>
			</DropdownMenuTriggerButton>
			<DropdownMenuContent align="end">
				<DropdownMenuGroup>
					<DropdownMenuItem className="pointer-events-none">
						<AvatarLabel size="sm">
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
	const isLogged = PageDataContextService.value.isLogged;
	const isReadOnly = PageDataContextService.value.conf.isReadOnly;
	const authUrl = apiUrlCreator.getAuthUrl(router, isLogged).toString();
	const enterprise = PageDataContextService.value.conf.enterprise;
	const workspaceContext = PageDataContextService.value.workspace;
	const currentWorkspaceName = PageDataContextService.value.workspace.current;
	const workspaceConfig = workspaceContext.workspaces.find(
		(workspaceConfig) => workspaceConfig.path === currentWorkspaceName,
	);
	const showEnterpriseSignIn = enterprise.gesUrl && !isReadOnly;

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
					<a href={authUrl} className="flex items-center gap-2 w-full" data-qa="qa-clickable">
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
