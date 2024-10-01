import { getExecutingEnvironment } from "@app/resolveModule/env";
import Button, { TextSize } from "@components/Atoms/Button/Button";
import SpinnerLoader from "@components/Atoms/SpinnerLoader";
import Query, { parserQuery } from "@core/Api/Query";
import { SourceUser } from "@ext/git/actions/Source/SourceAPI";
import { makeSourceApi } from "@ext/git/actions/Source/makeSourceApi";
import { waitForTempToken } from "@ext/git/actions/Source/tempToken";
import t from "@ext/localization/locale/translate";
import User2 from "@ext/security/components/User/User2";
import { useEffect, useState } from "react";
import createChildWindow from "../../../../../ui-logic/ChildWindow/createChildWindow";
import PageDataContextService from "../../../../../ui-logic/ContextServices/PageDataContext";
import SourceType from "../../../../storage/logic/SourceDataProvider/model/SourceType";
import ConfluenceCloudSourceData from "@ext/confluence/core/cloud/model/ConfluenceCloudSourceData";
import { ConfluenceInstance } from "@ext/confluence/core/api/model/ConfluenceAPITypes";
import ButtonLink from "@components/Molecules/ButtonLink";
import { ButtonStyle } from "@components/Atoms/Button/ButtonStyle";
import ConfluenceCloudAPI from "@ext/confluence/core/api/ConfluenceCloudAPI";

const CreateConfluenceCloudSourceData = ({
	onSubmit,
}: {
	onSubmit?: (editProps: ConfluenceCloudSourceData) => void;
}) => {
	const page = PageDataContextService.value;
	const authServiceUrl = PageDataContextService.value.conf.authServiceUrl;
	const [instanceData, setInstanceData] = useState<ConfluenceInstance>(null);
	const [user, setUser] = useState<SourceUser>(null);
	const [token, setToken] = useState<Query>(null);

	const getInstanceData = async (token: { [queryParam: string]: string }) => {
		if (!token || !token?.access_token) return;
		const api = new ConfluenceCloudAPI({
			sourceType: SourceType.confluenceCloud,
			token: token.access_token,
		} as ConfluenceCloudSourceData);
		setInstanceData(await api.getInstanceData());
	};

	const loadUser = async (token: { [queryParam: string]: string }) => {
		if (!token || !token?.access_token) return;
		const api = makeSourceApi({
			sourceType: SourceType.confluenceCloud,
			token: token.access_token,
			cloudId: instanceData.id,
			domain: instanceData.url,
		} as ConfluenceCloudSourceData);
		setUser(await api.getUser());
	};

	useEffect(() => {
		void getInstanceData(token);
	}, [token]);

	useEffect(() => {
		void loadUser(token);
	}, [instanceData]);

	return (
		<>
			<div className="form-group field field-string row field-height">
				<div className="control-label">{t("user")}</div>
				{token ? (
					<div className="input-lable">
						{instanceData && user ? (
							<div className="input-lable">
								<User2 name={user.username} />
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
						iconCode={SourceType.confluenceCloud.toLowerCase()}
						text={t("confluence.log-in")}
						onClick={async () => {
							if (token) return;
							createChildWindow(
								`${authServiceUrl}/confluence?redirect=${page?.domain}${page?.conf.basePath ?? ""}`,
								450,
								500,
								"https://team.atlassian.com/your-work",
								(location) => setToken(parserQuery(location.search)),
							);

							if (getExecutingEnvironment() == "browser") setToken(parserQuery(await waitForTempToken()));
						}}
					/>
				)}
			</div>
			<div className="buttons">
				<Button
					disabled={!instanceData || !token}
					onClick={() => {
						onSubmit({
							sourceType: SourceType.confluenceCloud,
							domain: instanceData.url,
							cloudId: instanceData.id,
							token: token.access_token,
							refreshToken: token.refresh_token,
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

export default CreateConfluenceCloudSourceData;
