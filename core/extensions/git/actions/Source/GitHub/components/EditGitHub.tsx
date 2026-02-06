import Icon from "@components/Atoms/Icon";
import { parserQuery } from "@core/Api/Query";
import createChildWindow from "@core-ui/ChildWindow/createChildWindow";
import PageDataContext from "@core-ui/ContextServices/PageDataContext";
import { useSetFooterButton } from "@core-ui/hooks/useFooterPortal";
import { usePlatform } from "@core-ui/hooks/usePlatform";
import styled from "@emotion/styled";
import OnNetworkApiErrorService from "@ext/errorHandlers/client/OnNetworkApiErrorService";
import GitHubSourceData from "@ext/git/actions/Source/GitHub/logic/GitHubSourceData";
import { makeSourceApi } from "@ext/git/actions/Source/makeSourceApi";
import { waitForTempToken } from "@ext/git/actions/Source/tempToken";
import t from "@ext/localization/locale/translate";
import SourceType from "@ext/storage/logic/SourceDataProvider/model/SourceType";
import { Avatar, AvatarFallback, AvatarImage, getAvatarFallback } from "@ui-kit/Avatar";
import { Button } from "@ui-kit/Button";
import { Field } from "@ui-kit/Field";
import { TextInput } from "@ui-kit/Input";
import { useLayoutEffect, useState } from "react";

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
			<Button disabled={!data} onClick={handleAddRepo} type="button">
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
				control={() =>
					data ? (
						<TextInput
							className="font-medium"
							readOnly
							startIcon={
								<Avatar size="xs">
									<AvatarImage src={data.avatarUrl} />
									<AvatarFallback uniqueId={data.userEmail}>
										{getAvatarFallback(data.userName)}
									</AvatarFallback>
								</Avatar>
							}
							value={data.userName}
						/>
					) : (
						<Button onClick={startAuth} type="button" variant="outline">
							<BoldIcon className="text-base" code="github" />
							{t("log-in")}
							GitHub
						</Button>
					)
				}
				layout="vertical"
				title={t("user")}
			/>
		</>
	);
};

export default EditGitHub;
