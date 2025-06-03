import { TextSize } from "@components/Atoms/Button/Button";
import { ButtonStyle } from "@components/Atoms/Button/ButtonStyle";
import FormStyle from "@components/Form/FormStyle";
import ButtonLink from "@components/Molecules/ButtonLink";
import createChildWindow from "@core-ui/ChildWindow/createChildWindow";
import PageDataContextService from "@core-ui/ContextServices/PageDataContext";
import { usePlatform } from "@core-ui/hooks/usePlatform";
import styled from "@emotion/styled";
import { waitForTempToken } from "@ext/git/actions/Source/tempToken";
import t from "@ext/localization/locale/translate";
import CloudApi from "@ext/static/logic/CloudApi";
import { useState } from "react";

const ButtonLinkWrapper = styled.div`
	i {
		fill: var(--color-btn-default-text);
	}

	&:hover {
		i {
			fill: var(--color-btn-default-text-hover);
		}
	}
`;

interface LoginGoogleProps {
	onLogin?: () => void;
}

const LoginGoogle = ({ onLogin }: LoginGoogleProps) => {
	const [isLoading, setIsLoading] = useState(false);
	const page = PageDataContextService.value;
	const cloudServiceUrl = page.conf.cloudServiceUrl;
	const [cloudAPi] = useState(() => new CloudApi(cloudServiceUrl));
	const redirectUrl = `${page?.domain}${page?.conf.basePath ?? ""}?access_token=success`;
	const { isTauri } = usePlatform();

	return (
		<FormStyle>
			<fieldset>
				<legend>{t("cloud.enter-cloud")}</legend>
				<ButtonLinkWrapper>
					<ButtonLink
						iconIsLoading={isLoading}
						fullWidth
						className="input-lable"
						buttonStyle={ButtonStyle.default}
						textSize={TextSize.M}
						iconFw={false}
						iconCode="google-icon"
						text={t("login-with") + "Google"}
						onClick={async () => {
							// TODO: test on tauri
							createChildWindow(cloudAPi.getOauthUrl("google", redirectUrl), 450, 500, cloudServiceUrl);
							setIsLoading(true);

							if (!isTauri) {
								await waitForTempToken();
								onLogin?.();
								setIsLoading(false);
							}
						}}
					/>
				</ButtonLinkWrapper>
			</fieldset>
		</FormStyle>
	);
};

export default LoginGoogle;
