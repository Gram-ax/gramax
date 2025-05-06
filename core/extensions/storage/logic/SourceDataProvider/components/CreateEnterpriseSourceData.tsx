import { getExecutingEnvironment } from "@app/resolveModule/env";
import Button, { TextSize } from "@components/Atoms/Button/Button";
import { ButtonStyle } from "@components/Atoms/Button/ButtonStyle";
import SpinnerLoader from "@components/Atoms/SpinnerLoader";
import ButtonLink from "@components/Molecules/ButtonLink";
import { parserQuery } from "@core/Api/Query";
import { waitForTempToken } from "@ext/git/actions/Source/tempToken";
import t from "@ext/localization/locale/translate";
import User2 from "@ext/security/components/User/User2";
import { useEffect, useState } from "react";

import createChildWindow from "@core-ui/ChildWindow/createChildWindow";
import { usePlatform } from "@core-ui/hooks/usePlatform";
import { getGesSignInUrl } from "@ext/enterprise/components/SignInEnterprise";
import EnterpriseApi from "@ext/enterprise/EnterpriseApi";
import GitSourceData from "@ext/git/core/model/GitSourceData.schema";
import SourceType from "@ext/storage/logic/SourceDataProvider/model/SourceType";

const CreateEnterpriseSourceData = ({
	sourceData,
	onSubmit,
}: {
	sourceData: GitSourceData;
	onSubmit?: (editProps: GitSourceData) => void;
}) => {
	const { isBrowser } = usePlatform();
	const gesUrl = sourceData.protocol + "://" + sourceData.domain;
	const loginUrl = getGesSignInUrl(gesUrl, isBrowser);

	const [user, setUser] = useState<{ name: string; email: string }>(null);
	const [token, setToken] = useState<string>(null);

	const loadUser = async (sourceData: GitSourceData, token: string) => {
		if (!token) return;
		const api = new EnterpriseApi(gesUrl);
		try {
			const user = await api.getUser(token);
			setUser({ name: user.info.name, email: user.info.mail });
		} catch (error) {
			console.error(error);
		}
	};

	useEffect(() => void loadUser(sourceData, token), [token]);

	return (
		<>
			<div className="form-group field field-string row field-height">
				<div className="control-label">{t("user")}</div>
				{token ? (
					<div className="input-lable">
						{user ? (
							<div className="input-lable">
								<User2 {...user} />
							</div>
						) : (
							<SpinnerLoader height={25} width={25} lineWidth={2} />
						)}
					</div>
				) : (
					<ButtonLink
						fullWidth
						className="input-lable"
						buttonStyle={ButtonStyle.default}
						textSize={TextSize.M}
						iconFw={false}
						iconCode="gramax"
						text={t("log-in") + "Enterprise"}
						onClick={async () => {
							if (token) return;
							createChildWindow(loginUrl, 450, 500, gesUrl, (location) => {
								setToken(parserQuery(location.search)?.enterpriseToken ?? "");
							});

							if (getExecutingEnvironment() !== "tauri")
								setToken(parserQuery(await waitForTempToken())?.enterpriseToken ?? "");
						}}
					/>
				)}
			</div>
			<div className="buttons">
				<Button
					disabled={!user || !token}
					onClick={() => {
						onSubmit({
							sourceType: SourceType.gitHub,
							protocol: sourceData.protocol,
							domain: sourceData.domain,
							token: token,
							userName: user.name,
							userEmail: user.email,
						});
					}}
				>
					{t("add")}
				</Button>
			</div>
		</>
	);
};

export default CreateEnterpriseSourceData;
