import Button from "@components/Atoms/Button/Button";
import Icon from "@components/Atoms/Icon";
import SpinnerLoader from "@components/Atoms/SpinnerLoader";
import OAuth2URL from "@core/utils/OAuth2URL";
import { useEffect, useState } from "react";
import { parserQuery } from "../../../../../../logic/Api/Query";
import createChildWindow from "../../../../../../ui-logic/ChildWindow/createChildWindow";
import PageDataContextService from "../../../../../../ui-logic/ContextServices/PageDataContext";
import useLocalize from "../../../../../localization/useLocalize";
import SourceType from "../../../../../storage/logic/SourceDataProvider/model/SourceType";
import GitHubApi from "../logic/GitHubApi";
import GitHubSourceData from "../logic/GitHubSourceData";
import GitHubUser from "./GitHubUser";

const CreateGitHubSourceData = ({ onSubmit }: { onSubmit?: (editProps: GitHubSourceData) => void }) => {
	const domain = PageDataContextService.value?.domain;
	const [user, setUser] = useState(null);
	const [token, setToken] = useState(null);

	const loadUser = async (token) => {
		if (!token || !token?.access_token) return;
		const gitHubApi = new GitHubApi(token.access_token);
		setUser(await gitHubApi.getUserData());
	};

	useEffect(() => {
		loadUser(token);
	}, [token]);

	return (
		<>
			<div className="form-group field field-string row field-height">
				<div className="control-label">Пользователь</div>
				{token ? (
					<div className="input-lable">
						{user ? (
							<div className="input-lable">
								<GitHubUser {...user} />
							</div>
						) : (
							<SpinnerLoader height={25} width={25} lineWidth={2} />
						)}
					</div>
				) : (
					<Button
						fullWidth
						className="input-lable"
						onClick={() => {
							if (token) return;
							createChildWindow(
								`${OAuth2URL}/github?redirect=${domain}`,
								450,
								500,
								"https://github.com/login/device/success",
								(location) => setToken(parserQuery(location.search) as any),
							);
						}}
					>
						<div>
							<Icon code="github" prefix="fab" />
							<span>Войти в GitHub</span>
						</div>
					</Button>
				)}
			</div>
			<div className="buttons">
				<Button
					disabled={!user || !token}
					onClick={() => {
						onSubmit({
							sourceType: SourceType.gitHub,
							domain: "github.com",
							token: token.access_token,
							userName: user.name,
							userEmail: user.email,
							refreshToken: token.refresh_token,
							createDate: new Date().toJSON(),
						});
					}}
				>
					{useLocalize("add")}
				</Button>
			</div>
		</>
	);
};

export default CreateGitHubSourceData;
