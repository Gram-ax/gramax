import Icon from "@components/Atoms/Icon";
import Query, { parserQuery } from "@core/Api/Query";
import createChildWindow from "@core-ui/ChildWindow/createChildWindow";
import PageDataContext from "@core-ui/ContextServices/PageDataContext";
import { useSetFooterButton } from "@core-ui/hooks/useFooterPortal";
import { usePlatform } from "@core-ui/hooks/usePlatform";
import ConfluenceCloudAPI from "@ext/confluence/core/api/ConfluenceCloudAPI";
import { ConfluenceInstance } from "@ext/confluence/core/api/model/ConfluenceAPITypes";
import ConfluenceCloudSourceData from "@ext/confluence/core/cloud/model/ConfluenceCloudSourceData";
import { makeSourceApi } from "@ext/git/actions/Source/makeSourceApi";
import { SourceUser } from "@ext/git/actions/Source/SourceAPI";
import { waitForTempToken } from "@ext/git/actions/Source/tempToken";
import t from "@ext/localization/locale/translate";
import SourceType from "@ext/storage/logic/SourceDataProvider/model/SourceType";
import { Avatar, AvatarFallback, AvatarImage, getAvatarFallback } from "@ui-kit/Avatar";
import { Button } from "@ui-kit/Button";
import { Field } from "@ui-kit/Field";
import { TextInput } from "@ui-kit/Input";
import { useLayoutEffect, useState } from "react";

const EditConfluenceCloudForm = ({ onSubmit }: { onSubmit: (data: ConfluenceCloudSourceData) => void }) => {
	const { setPrimaryButton } = useSetFooterButton();
	const { isBrowser } = usePlatform();
	const {
		domain,
		conf: { authServiceUrl, basePath },
	} = PageDataContext.value;

	const [instanceData, setInstanceData] = useState<ConfluenceInstance>(null);
	const [user, setUser] = useState<SourceUser>(null);
	const [token, setToken] = useState<Query>(null);

	const getInstanceData = async (token: { [queryParam: string]: string }) => {
		if (!token || !token?.access_token) return;
		const api = new ConfluenceCloudAPI({
			sourceType: SourceType.confluenceCloud,
			token: token.access_token,
		} as ConfluenceCloudSourceData);

		return await api.getInstanceData();
	};

	const procceedAuth = async (token: Query) => {
		if (!token || !token?.access_token) return;
		setToken(token);

		const instanceData = await getInstanceData(token);
		setInstanceData(instanceData);

		const user = await loadUser(instanceData, token);
		setUser(user);
	};

	const startAuth = async () => {
		if (token) return;
		createChildWindow(
			`${authServiceUrl}/confluence?redirect=${domain}${basePath ?? ""}`,
			450,
			500,
			"https://team.atlassian.com/your-work",
			(location) => procceedAuth(parserQuery(location.search)),
		);

		if (isBrowser) procceedAuth(parserQuery(await waitForTempToken()));
	};

	const loadUser = async (instanceData: ConfluenceInstance, token: { [queryParam: string]: string }) => {
		if (!token || !token?.access_token) return;
		const api = makeSourceApi({
			sourceType: SourceType.confluenceCloud,
			token: token.access_token,
			cloudId: instanceData.id,
			domain: instanceData.url,
		} as ConfluenceCloudSourceData);
		return await api.getUser();
	};

	useLayoutEffect(() => {
		const handleAddRepo = () => {
			if (token) {
				onSubmit({
					sourceType: SourceType.confluenceCloud,
					domain: instanceData.url,
					cloudId: instanceData.id,
					token: token.access_token,
					refreshToken: token.refresh_token,
					userName: user.name,
					userEmail: user.email,
				});
			}
		};

		const primaryButton = (
			<Button disabled={!token} onClick={handleAddRepo} type="button">
				{t("add")}
			</Button>
		);

		setPrimaryButton(primaryButton);

		return () => {
			setPrimaryButton(null);
		};
	}, [token, instanceData, user, onSubmit]);

	return (
		<>
			<Field
				control={() =>
					user ? (
						<TextInput
							className="font-medium"
							readOnly
							startIcon={
								<Avatar size="xs">
									<AvatarImage src={user.avatarUrl} />
									<AvatarFallback uniqueId={user.email}>
										{getAvatarFallback(user.name)}
									</AvatarFallback>
								</Avatar>
							}
							value={user.name}
						/>
					) : (
						<Button onClick={startAuth} type="button" variant="outline">
							<Icon className="text-base" code="confluence cloud" />
							{t("log-in")}
							Confluence Cloud
						</Button>
					)
				}
				layout="vertical"
				title={t("user")}
			/>
		</>
	);
};

export default EditConfluenceCloudForm;
