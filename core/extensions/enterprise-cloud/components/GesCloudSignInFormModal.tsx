import resolveFrontendModule from "@app/resolveModule/frontend";
import Icon from "@components/Atoms/Icon";
import { useRouter } from "@core/Api/useRouter";
import FetchService from "@core-ui/ApiServices/FetchService";
import ApiUrlCreatorService from "@core-ui/ContextServices/ApiUrlCreator";
import PageDataContextService from "@core-ui/ContextServices/PageDataContext";
import { useBreakpoint } from "@core-ui/hooks/useBreakpoint";
import { usePlatform } from "@core-ui/hooks/usePlatform";
import { cn } from "@core-ui/utils/cn";
import { relocateToUrl } from "@ext/enterprise/components/SingInOut/hooks/useSignIn";
import t from "@ext/localization/locale/translate";
import { Button } from "@ui-kit/Button";
import { Dialog, DialogContent } from "@ui-kit/Dialog";
import { ContentDivider } from "@ui-kit/Divider";
import { useCallback, useState } from "react";
import { Logo, TopContainerWrapper } from "../../../components/HomePage/Welcome/Editor";

interface SignInGesCloudFormProps {
	allowContinueWithoutAccount: boolean;
	className?: string;
}

interface SignInGesCloudFormModalProps extends SignInGesCloudFormProps {
	onClose: () => void;
}

function getGesCloudSignInUrl(gesUrl: string, provider: "google" | "yandex", isTauri: boolean) {
	const url = new URL(gesUrl);
	url.pathname = `/sso/login/${provider}`;

	const from = isTauri ? "http://localhost:52054" : window.location.href;
	url.searchParams.set("from", from);
	if (isTauri) url.searchParams.set("useOneTimeCode", "true");

	return url.toString();
}

export const GesCloudSignInFormModal = (props: SignInGesCloudFormModalProps) => {
	const { allowContinueWithoutAccount, onClose, className } = props;
	const [open, setOpen] = useState(true);

	const onOpenChangeHandler = useCallback(
		(open: boolean) => {
			setOpen(open);
			if (!open) onClose();
		},
		[onClose],
	);

	return (
		<Dialog onOpenChange={onOpenChangeHandler} open={open}>
			<DialogContent data-modal-root>
				<div className="p-4">
					<SignInGesCloudForm
						allowContinueWithoutAccount={allowContinueWithoutAccount}
						className={className}
					/>
				</div>
			</DialogContent>
		</Dialog>
	);
};

export const SignInGesCloudForm = ({ allowContinueWithoutAccount, className }: SignInGesCloudFormProps) => {
	const breakpoint = useBreakpoint();
	const { url: gesCloudUrl } = PageDataContextService.value.conf.enterpriseCloud;
	const apiUrlCreator = ApiUrlCreatorService.value;
	const router = useRouter();

	const { environment } = usePlatform();
	const isTauri = environment === "tauri";

	const executeLogin = useCallback(
		async (url: string) => {
			await FetchService.fetch(apiUrlCreator.getEnableCloudUrl());
			if (isTauri) await resolveFrontendModule("gesCloudLogin")(url, apiUrlCreator, router, gesCloudUrl);
			else relocateToUrl(url);
		},
		[apiUrlCreator, router, isTauri, gesCloudUrl],
	);

	const yandexAuthUrl = getGesCloudSignInUrl(gesCloudUrl, "yandex", isTauri);
	const relocateToYandexAuthUrl = useCallback(() => {
		void executeLogin(yandexAuthUrl);
	}, [executeLogin, yandexAuthUrl]);

	const googleAuthUrl = getGesCloudSignInUrl(gesCloudUrl, "google", isTauri);
	const relocateToGoogleAuthUrl = useCallback(() => {
		void executeLogin(googleAuthUrl);
	}, [executeLogin, googleAuthUrl]);

	const handleContinueWithoutAccount = useCallback(async () => {
		await FetchService.fetch(apiUrlCreator.getDisableCloudUrl());
		refreshPage();
	}, [apiUrlCreator]);

	return (
		<div className={cn("flex flex-col gap-6 form-wrap", className)}>
			<div className="header flex flex-col justify-center items-center text-center p-6 pb-0 gap-3">
				<Logo isMobile={breakpoint === "sm"} />
				<TopContainerWrapper className={cn(breakpoint === "sm" && "mobile")}>
					<h1 className="text-2xl font-semibold sm:text-lg">{t("welcome.editor.title")}</h1>
					<div className="description text-base text-muted sm:text-sm font-normal">
						{t("enterprise-cloud-guest.description")}
					</div>
				</TopContainerWrapper>
			</div>
			<div className="flex flex-col gap-2">
				<Button onClick={relocateToGoogleAuthUrl} type="button" variant="outline">
					<Icon code="google-icon" />
					{t("enterprise-cloud-guest.buttons.continueWithGoogle")}
				</Button>
				<Button onClick={relocateToYandexAuthUrl} type="button" variant="outline">
					<Icon code="yandex" />
					{t("enterprise-cloud-guest.buttons.continueWithYandex")}
				</Button>
			</div>
			{allowContinueWithoutAccount && (
				<>
					<ContentDivider>
						<div className="text-sm text-center font-normal text-muted whitespace-nowrap">{t("or")}</div>
					</ContentDivider>
					<Button onClick={handleContinueWithoutAccount} type="button" variant="text">
						{t("enterprise-cloud-guest.buttons.continueWithoutAccount")}
					</Button>
				</>
			)}
		</div>
	);
};
