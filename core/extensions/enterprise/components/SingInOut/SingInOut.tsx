import { useRouter } from "@core/Api/useRouter";
import ApiUrlCreatorService from "@core-ui/ContextServices/ApiUrlCreator";
import ModalToOpenService from "@core-ui/ContextServices/ModalToOpenService/ModalToOpenService";
import ModalToOpen from "@core-ui/ContextServices/ModalToOpenService/model/ModalsToOpen";
import PageDataContextService from "@core-ui/ContextServices/PageDataContext";
import useDesktopEnterpriseSession from "@ext/enterprise/components/SingInOut/hooks/useDesktopEnterpriseSession";
import useSignOut from "@ext/enterprise/components/SingInOut/hooks/useSignOut";
import SignInEnterprise from "@ext/enterprise/components/SingInOut/SignInEnterprise";
import SignInEnterpriseModal from "@ext/enterprise/components/SingInOut/SignInEnterpriseModal";
import SignInModalTrigger from "@ext/enterprise-cloud/components/SignInModalTrigger";
import t from "@ext/localization/locale/translate";
import { IconButton } from "@ui-kit/Button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@ui-kit/Tooltip";
import { LogoutButton, SignOut, UserAvatar } from "../../../../components/UserAvatar";

export const SignInDocportal = () => {
	const router = useRouter();
	const apiUrlCreator = ApiUrlCreatorService.value;
	const isLogged = PageDataContextService.value.isLogged;
	const authUrl = apiUrlCreator.getAuthUrl(router, isLogged).toString();

	if (isLogged) return <UserAvatar logoutComponent={<LogoutButton authUrl={authUrl} />} />;
	return <SignInEnterpriseModal authUrl={authUrl} />;
};

export const SingInBrowser = () => {
	const { isLogged, onLogoutClick } = useSignOut();

	if (isLogged) return <UserAvatar logoutComponent={<SignOut />} onLogoutClick={onLogoutClick} />;
	return <SignInEnterprise trigger={<IconButton icon="log-in" variant="ghost" />} />;
};

export const SingInTauri = () => {
	const { onLogoutClick } = useSignOut();
	const { isCurrentEnterpriseSession, shouldOpenTauriGesModal } = useDesktopEnterpriseSession();

	const trigger = (
		<Tooltip>
			<TooltipContent>
				<p>{t("sing-in")}</p>
			</TooltipContent>
			<TooltipTrigger asChild>
				<IconButton
					className="p-2"
					icon={"user-round"}
					iconClassName="w-5 h-5 stroke-[1.6]"
					size="lg"
					variant="ghost"
				/>
			</TooltipTrigger>
		</Tooltip>
	);

	if (isCurrentEnterpriseSession) return <UserAvatar logoutComponent={<SignOut />} onLogoutClick={onLogoutClick} />;
	if (!shouldOpenTauriGesModal) return <SignInEnterprise trigger={trigger} />;

	return <div onClick={() => ModalToOpenService.setValue(ModalToOpen.TauriGesSignIn)}>{trigger}</div>;
};

export const GesCloudSignInOut = () => {
	const { isLogged, onLogoutClick } = useSignOut();
	const { gesUrl } = PageDataContextService.value.conf.enterprise;

	if (!!gesUrl && !isLogged) return <SignInModalTrigger gesUrl={gesUrl} />;

	return <UserAvatar logoutComponent={<SignOut />} onLogoutClick={onLogoutClick} />;
};
