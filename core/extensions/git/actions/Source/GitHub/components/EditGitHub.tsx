import t from "@ext/localization/locale/translate";
import Icon from "@components/Atoms/Icon";
import { Field } from "@ui-kit/Field";
import { Button } from "@ui-kit/Button";
import createChildWindow from "@core-ui/ChildWindow/createChildWindow";
import PageDataContext from "@core-ui/ContextServices/PageDataContext";
import { useState, useLayoutEffect } from "react";
import { useSetFooterButton } from "@core-ui/hooks/useFooterPortal";
import GitHubSourceData from "@ext/git/actions/Source/GitHub/logic/GitHubSourceData";
import { parserQuery } from "@core/Api/Query";
import { waitForTempToken } from "@ext/git/actions/Source/tempToken";
import { usePlatform } from "@core-ui/hooks/usePlatform";
import OnNetworkApiErrorService from "@ext/errorHandlers/client/OnNetworkApiErrorService";
import { makeSourceApi } from "@ext/git/actions/Source/makeSourceApi";
import SourceType from "@ext/storage/logic/SourceDataProvider/model/SourceType";
import { Avatar, AvatarFallback, AvatarImage, getAvatarFallback } from "@ui-kit/Avatar";
import { TextInput } from "@ui-kit/Input";
import styled from "@emotion/styled";

type Token = {
	access_token: string;
	auth_type: "github";
};

type UserData = GitHubSourceData & {
	avatarUrl: string;
};

interface EditGitHubProps {
	onSubmit: (data: GitHubSourceData) => void;
	data?: Partial<GitHubSourceData>;
}

const DOMAIN = "github.com";
const PROTOCOL = "https";

const BoldIcon = styled(Icon)`
	svg {
		stroke-width: 2;
	}
`;

const EditGitHub = ({ onSubmit, data: initialData }: EditGitHubProps) => {
	const { isTauri } = usePlatform();
	const { setPrimaryButton } = useSetFooterButton();
	const {
		domain,
		conf: { authServiceUrl, basePath },
	} = PageDataContext.value;
	const onNetworkApiError = OnNetworkApiErrorService.value;
	const [data, setData] = useState<UserData>(null);

	const getConnectedUserData = async (token: string) => {
		const api = makeSourceApi(
			{ sourceType: SourceType.gitHub, token: token } as GitHubSourceData,
			authServiceUrl,
			onNetworkApiError,
		);
		return await api.getUser();
	};

	const processQuery = async (location: string) => {
		const token = parserQuery<Token>(location);
		const user = await getConnectedUserData(token.access_token);
		setData({
			sourceType: SourceType.gitHub,
			token: token.access_token,
			userName: user.name,
			userEmail: user.email,
			domain: DOMAIN,
			protocol: PROTOCOL,
			createDate: new Date().toJSON(),
			avatarUrl: user.avatarUrl,
		});
	};

	const startAuth = async () => {
		if (data) return;
		createChildWindow(
			`${authServiceUrl}/github?redirect=${domain}${basePath ?? ""}`,
			450,
			500,
			"https://github.com/login/device/success",
			async (location) => await processQuery(location.search),
		);

		if (!isTauri) await processQuery(await waitForTempToken());
	};

	useLayoutEffect(() => {
		const handleAddRepo = () => {
			if (data) {
				onSubmit({
					sourceType: SourceType.gitHub,
					protocol: PROTOCOL,
					domain: DOMAIN,
					token: data.token,
					userName: data.userName,
					userEmail: data.userEmail,
					refreshToken: data.refreshToken,
					createDate: new Date().toJSON(),
					isInvalid: data ? undefined : initialData?.isInvalid,
				});
			}
		};

		const primaryButton = (
			<Button type="button" disabled={!data} onClick={handleAddRepo}>
				{t("add")}
			</Button>
		);

		setPrimaryButton(primaryButton);

		return () => {
			setPrimaryButton(null);
		};
	}, [data]);

	return (
		<>
			<Field
				title={t("user")}
				layout="vertical"
				control={() =>
					data ? (
						<TextInput
							startIcon={
								<Avatar size="xs">
									<AvatarImage src={data.avatarUrl} />
									<AvatarFallback>{getAvatarFallback(data.userName)}</AvatarFallback>
								</Avatar>
							}
							className="font-medium"
							value={data.userName}
							readOnly
						/>
					) : (
						<Button type="button" variant="outline" onClick={startAuth}>
							<BoldIcon code="github" className="text-base" />
							{t("log-in")}
							GitHub
						</Button>
					)
				}
			/>
		</>
	);
};

export default EditGitHub;
