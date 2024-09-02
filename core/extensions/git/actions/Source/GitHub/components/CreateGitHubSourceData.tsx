import { getExecutingEnvironment } from "@app/resolveModule/env";
import Button, { TextSize } from "@components/Atoms/Button/Button";
import SpinnerLoader from "@components/Atoms/SpinnerLoader";
import { parserQuery } from "@core/Api/Query";
import { waitForTempToken } from "@ext/git/actions/Source/tempToken";
import t from "@ext/localization/locale/translate";
import User2 from "@ext/security/components/User/User2";
import { useEffect, useState } from "react";
import createChildWindow from "../../../../../../ui-logic/ChildWindow/createChildWindow";
import PageDataContextService from "../../../../../../ui-logic/ContextServices/PageDataContext";
import SourceType from "../../../../../storage/logic/SourceDataProvider/model/SourceType";
import { makeSourceApi } from "../../makeSourceApi";
import GitHubSourceData from "../logic/GitHubSourceData";
import ButtonLink from "@components/Molecules/ButtonLink";
import { ButtonStyle } from "@components/Atoms/Button/ButtonStyle";

const CreateGitHubSourceData = ({ onSubmit }: { onSubmit?: (editProps: GitHubSourceData) => void }) => {
	const page = PageDataContextService.value;
	const authServiceUrl = PageDataContextService.value.conf.authServiceUrl;
	const [user, setUser] = useState(null);
	const [token, setToken] = useState(null);

	const loadUser = async (token) => {
		if (!token || !token?.access_token) return;
		const api = makeSourceApi(
			{ sourceType: SourceType.gitHub, token: token.access_token } as GitHubSourceData,
			authServiceUrl,
		);
		setUser(await api.getUser());
	};

	useEffect(() => void loadUser(token), [token]);

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
						iconCode="github"
						text={t("log-in.github")}
						onClick={async () => {
							if (token) return;
							createChildWindow(
								`${authServiceUrl}/github?redirect=${page?.domain}${page?.conf.basePath ?? ""}`,
								450,
								500,
								"https://github.com/login/device/success",
								(location) => setToken(parserQuery(location.search)),
							);

							if (getExecutingEnvironment() !== "tauri") setToken(parserQuery(await waitForTempToken()));
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
							protocol: "https",
							domain: "github.com",
							token: token.access_token,
							userName: user.name,
							userEmail: user.email,
							refreshToken: token.refresh_token,
							createDate: new Date().toJSON(),
						});
					}}
				>
					{t("add")}
				</Button>
			</div>
		</>
	);
};

export default CreateGitHubSourceData;
