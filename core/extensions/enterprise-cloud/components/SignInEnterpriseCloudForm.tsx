import Icon from "@components/Atoms/Icon";
import FetchService from "@core-ui/ApiServices/FetchService";
import ApiUrlCreatorService from "@core-ui/ContextServices/ApiUrlCreator";
import { useBreakpoint } from "@core-ui/hooks/useBreakpoint";
import { cn } from "@core-ui/utils/cn";
import t from "@ext/localization/locale/translate";
import { Button } from "@ui-kit/Button";
import { ContentDivider } from "@ui-kit/Divider";
import { useCallback } from "react";
import { Logo, TopContainerWrapper } from "../../../components/HomePage/Welcome/Editor";
import { relocateToUrl } from "../../enterprise/components/useSignInEnterprise";

interface SignInEnterpriseCloudFormProps {
	gesUrl: string;
	allowContinueWithoutAccount: boolean;
	className?: string;
}

function getGesCloudSignInUrl(gesUrl: string, provider: "google" | "yandex", isBrowser: boolean) {
	const from = encodeURIComponent(isBrowser ? window.location.href : `http://localhost:52054`);
	return `${gesUrl}/sso/login/${provider}?from=${from}`;
}

export const SignInEnterpriseCloudForm = ({
	gesUrl,
	allowContinueWithoutAccount,
	className,
}: SignInEnterpriseCloudFormProps) => {
	const breakpoint = useBreakpoint();

	const apiUrlCreator = ApiUrlCreatorService.value;

	const yandexAuthUrl = getGesCloudSignInUrl(gesUrl, "yandex", true);
	const relocateToYandexAuthUrl = useCallback(() => relocateToUrl(yandexAuthUrl), [yandexAuthUrl]);

	const googleAuthUrl = getGesCloudSignInUrl(gesUrl, "google", true);
	const relocateToGoogleAuthUrl = useCallback(() => relocateToUrl(googleAuthUrl), [googleAuthUrl]);

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
					<Button
						onClick={async () => {
							const response = await FetchService.fetch(apiUrlCreator.offEnterpriseUrl());
							if (response.ok) refreshPage();
						}}
						type="button"
						variant="text"
					>
						{t("enterprise-cloud-guest.buttons.continueWithoutAccount")}
					</Button>
				</>
			)}
		</div>
	);
};
