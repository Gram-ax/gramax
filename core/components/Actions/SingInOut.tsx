import ButtonLink from "@components/Molecules/ButtonLink";
import ApiUrlCreatorService from "@core-ui/ContextServices/ApiUrlCreator";
import PageDataContextService from "@core-ui/ContextServices/PageDataContext";
import { useRouter } from "@core/Api/useRouter";
import styled from "@emotion/styled";
import SignInOutEnterprise from "@ext/enterprise/SignInOutEnterprise";
import t from "@ext/localization/locale/translate";

const SingInOut = styled(({ className }: { className?: string }) => {
	const router = useRouter();
	const apiUrlCreator = ApiUrlCreatorService.value;
	const isLogged = PageDataContextService.value.isLogged;
	const isServerApp = PageDataContextService.value.conf.isServerApp;
	const isSsoEnabled = PageDataContextService.value.conf.isSsoEnabled;
	const authUrl = apiUrlCreator.getAuthUrl(router).toString();
	const glsUrl = PageDataContextService.value.conf.glsUrl;
	const showEnterpriseSignIn = glsUrl && !isServerApp;

	if (showEnterpriseSignIn)
		return (
			<div className={className}>
				<SignInOutEnterprise />
			</div>
		);

	if (isServerApp && isLogged) {
		return (
			<div className={className}>
				<a href={authUrl} data-qa="qa-clickable">
					<ButtonLink iconCode="log-out" text={t("sing-out")} />
				</a>
			</div>
		);
	}

	if (isServerApp && isSsoEnabled) {
		return (
			<div>
				<a href={authUrl} data-qa="qa-clickable">
					<ButtonLink iconCode="log-in" text={t("sing-in")} />
				</a>
			</div>
		);
	}
})`
	display: flex;
	font-size: 12px;
	align-items: center;
`;

export default SingInOut;
