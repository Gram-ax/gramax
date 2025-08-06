import Icon from "@components/Atoms/Icon";
import { classNames } from "@components/libs/classNames";
import createChildWindow from "@core-ui/ChildWindow/createChildWindow";
import PageDataContextService from "@core-ui/ContextServices/PageDataContext";
import { usePlatform } from "@core-ui/hooks/usePlatform";
import styled from "@emotion/styled";
import { waitForTempToken } from "@ext/git/actions/Source/tempToken";
import t from "@ext/localization/locale/translate";
import CodeBlock from "@ext/markdown/elements/codeBlockLowlight/render/component/CodeBlock";
import CloudApi from "@ext/static/logic/CloudApi";
import { Button } from "@ui-kit/Button";
import { FormFooter, FormHeader } from "@ui-kit/Form";
import { useState } from "react";
import CloudStateService from "@core-ui/ContextServices/CloudState";
import CloudModalBody from "@ext/static/components/CloudModalBody";

const GRAMAX_CLOUD_NAME = "Gramax Cloud";

const ButtonLink = ({ onLogin, className }: { onLogin: () => void; className?: string }) => {
	const [isLoading, setIsLoading] = useState(false);
	const page = PageDataContextService.value;
	const cloudServiceUrl = page.conf.cloudServiceUrl;
	const [cloudAPi] = useState(() => new CloudApi(cloudServiceUrl));
	const redirectUrl = `${page?.domain}${page?.conf.basePath ?? ""}`;
	const { isTauri } = usePlatform();

	const onClick = async () => {
		const login = async (query: string) => {
			await cloudAPi.signIn(query);
			onLogin?.();
			setIsLoading(false);
		};
		setIsLoading(true);

		createChildWindow(
			cloudAPi.getOauthUrl("google", redirectUrl),
			450,
			500,
			cloudAPi.getLoginSuccessUrl(),
			(location) => {
				void login(location.search);
			},
		);

		if (!isTauri) {
			void login(await waitForTempToken());
		}
	};

	return (
		<Button className={classNames(className, {}, ["w-full"])} onClick={onClick}>
			<Icon code="google-icon" isLoading={isLoading} />
			{t("login-with") + "Google"}
		</Button>
	);
};

const StyledButtonLink = styled(ButtonLink)`
	i {
		fill: hsl(var(--primary-bg));
	}

	.spinner {
		text-align: justify;
	}
`;

interface LoginGoogleProps {
	onLogin?: () => void;
}

const LoginGoogle = ({ onLogin }: LoginGoogleProps) => {
	const cloudUrl = CloudStateService.value.cloudUrl;
	return (
		<>
			<FormHeader
				title={t("cloud.login-modal.title")}
				description={t("cloud.login-modal.description")}
				icon="lock-keyhole"
			/>
			<CloudModalBody>
				<p>
					<strong>{GRAMAX_CLOUD_NAME}</strong> — {t("cloud.login-modal.definition")}:
				</p>
				<CodeBlock value={cloudUrl} />
				<p>{t("cloud.login-modal.account-info")}</p>
			</CloudModalBody>
			<FormFooter primaryButton={<StyledButtonLink onLogin={onLogin} />} />
		</>
	);
};

export default LoginGoogle;
