import Icon from "@components/Atoms/Icon";
import PageDataContextService from "@core-ui/ContextServices/PageDataContext";
import t from "@ext/localization/locale/translate";
import type UserInfo from "@ext/security/logic/User/UserInfo";
import {
	Avatar,
	AvatarFallback,
	AvatarLabel,
	AvatarLabelAvatar,
	AvatarLabelDescription,
	AvatarLabelTitle,
	getAvatarFallback,
} from "@ui-kit/Avatar";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuGroup,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTriggerButton,
} from "@ui-kit/Dropdown";

export const LogoutButton = ({ authUrl }: { authUrl: string }) => {
	return (
		<a className="flex items-center gap-2 w-full" data-qa="qa-clickable" href={authUrl}>
			<SignOut />
		</a>
	);
};

export const SignOut = () => {
	return (
		<>
			<Icon code="log-out" />
			{t("sing-out")}
		</>
	);
};
interface UserAvatarProps {
	logoutComponent: React.ReactNode;
	onLogoutClick?: () => void;
}

const getCode = (user: UserInfo): string => {
	let code = getAvatarFallback(user?.name ?? "");
	if (!code) code = user?.mail?.[0] ?? "";
	if (!code) code = "";
	return code.toUpperCase();
};

export const UserAvatar = ({ logoutComponent, onLogoutClick }: UserAvatarProps) => {
	const userInfo = PageDataContextService.value?.userInfo;
	const code = getCode(userInfo);

	return (
		<DropdownMenu>
			<DropdownMenuTriggerButton className="aspect-square rounded-full p-0" variant="ghost">
				<Avatar size="sm">
					<AvatarFallback uniqueId={userInfo?.mail ?? ""}>{code}</AvatarFallback>
				</Avatar>
			</DropdownMenuTriggerButton>
			<DropdownMenuContent align="end">
				<DropdownMenuGroup>
					<DropdownMenuItem className="pointer-events-none">
						<AvatarLabel size="md">
							<AvatarLabelAvatar>
								<AvatarFallback>{code}</AvatarFallback>
							</AvatarLabelAvatar>
							<AvatarLabelTitle>{userInfo?.name ?? ""}</AvatarLabelTitle>
							<AvatarLabelDescription>{userInfo?.mail ?? ""}</AvatarLabelDescription>
						</AvatarLabel>
					</DropdownMenuItem>
					<DropdownMenuSeparator />
					<DropdownMenuItem onSelect={onLogoutClick}>{logoutComponent}</DropdownMenuItem>
				</DropdownMenuGroup>
			</DropdownMenuContent>
		</DropdownMenu>
	);
};
