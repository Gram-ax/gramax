import Icon from "@components/Atoms/Icon";
import FetchService from "@core-ui/ApiServices/FetchService";
import ApiUrlCreatorService from "@core-ui/ContextServices/ApiUrlCreator";
import PageDataContextService from "@core-ui/ContextServices/PageDataContext";
import { useBreakpoint } from "@core-ui/hooks/useBreakpoint";
import { cn } from "@core-ui/utils/cn";
import t from "@ext/localization/locale/translate";
import { Button } from "@ui-kit/Button";
import { Dialog, DialogContent } from "@ui-kit/Dialog";
import { ContentDivider } from "@ui-kit/Divider";
import { useCallback, useState } from "react";
import { Logo, TopContainerWrapper } from "../../../components/HomePage/Welcome/Editor";
import { relocateToUrl } from "../../enterprise/components/SingInOut/hooks/useSignIn";

interface SignInGesCloudFormProps {
	allowContinueWithoutAccount: boolean;
	className?: string;
}

interface SignInGesCloudFormModalProps extends SignInGesCloudFormProps {
	onClose: () => void;
}

function getGesCloudSignInUrl(gesUrl: string, provider: "google" | "yandex", isBrowser: boolean) {
	const from = encodeURIComponent(isBrowser ? window.location.href : `http://localhost:52054`);
	return `${gesUrl}/sso/login/${provider}?from=${from}`;
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

	const yandexAuthUrl = getGesCloudSignInUrl(gesCloudUrl, "yandex", true);
	const relocateToYandexAuthUrl = useCallback(async () => {
		await FetchService.fetch(apiUrlCreator.getEnableCloudUrl());
		relocateToUrl(yandexAuthUrl);
	}, [apiUrlCreator, yandexAuthUrl]);

	const googleAuthUrl = getGesCloudSignInUrl(gesCloudUrl, "google", true);
	const relocateToGoogleAuthUrl = useCallback(async () => {
		await FetchService.fetch(apiUrlCreator.getEnableCloudUrl());
		relocateToUrl(googleAuthUrl);
	}, [apiUrlCreator, googleAuthUrl]);

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
