import ButtonLink from "@components/Molecules/ButtonLink";
import ApiUrlCreatorService from "@core-ui/ContextServices/ApiUrlCreator";
import PageDataContextService from "@core-ui/ContextServices/PageDataContext";
import { useRouter } from "@core/Api/useRouter";
import styled from "@emotion/styled";
import SignInOutEnterprise from "@ext/enterprise/components/SignInOutEnterprise";
import t from "@ext/localization/locale/translate";

const SingInOut = styled(({ className, isHomePage }: { className?: string; isHomePage?: boolean }) => {
	const router = useRouter();
	const apiUrlCreator = ApiUrlCreatorService.value;
	const isLogged = PageDataContextService.value.isLogged;
	const isReadOnly = PageDataContextService.value.conf.isReadOnly;
	const authUrl = apiUrlCreator.getAuthUrl(router).toString();
	const enterprise = PageDataContextService.value.conf.enterprise;
	const showEnterpriseSignIn = enterprise.gesUrl && !isReadOnly;

	if (showEnterpriseSignIn && isHomePage)
		return (
			<div className={className}>
				<SignInOutEnterprise />
			</div>
		);

	if (isReadOnly && isLogged) {
		return (
			<div className={className}>
				<a href={authUrl} data-qa="qa-clickable">
					<ButtonLink iconCode="log-out" text={t("sing-out")} />
				</a>
			</div>
		);
	}

	if (isReadOnly && enterprise.gesUrl) {
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
