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
import ButtonLink from "@components/Molecules/ButtonLink";
import { ButtonStyle } from "@components/Atoms/Button/ButtonStyle";
import YandexDiskSourceData from "@ext/yandexDisk/model/YandexDiskSourceData";
import SourceType from "@ext/storage/logic/SourceDataProvider/model/SourceType";
import createChildWindow from "@core-ui/ChildWindow/createChildWindow";
import PageDataContextService from "@core-ui/ContextServices/PageDataContext";

const CreateYandexDiskSourceData = ({ onSubmit }: { onSubmit?: (editProps: YandexDiskSourceData) => void }) => {
	const page = PageDataContextService.value;
	const authServiceUrl = PageDataContextService.value.conf.authServiceUrl;
	const [user, setUser] = useState<SourceUser>(null);
	const [token, setToken] = useState<Query>(null);

	const loadUser = async (token: { [queryParam: string]: string }) => {
		if (!token || !token?.access_token) return;
		const api = makeSourceApi({
			sourceType: SourceType.yandexDisk,
			token: token.access_token,
		} as YandexDiskSourceData);
		setUser(await api.getUser());
	};

	useEffect(() => {
		void loadUser(token);
	}, [token]);

	return (
		<>
			<div className="form-group field field-string row field-height">
				<div className="control-label">{t("user")}</div>
				{token ? (
					<div className="input-lable">
						{user ? (
							<div className="input-lable">
								<User2 name={user.name} />
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
						iconCode={SourceType.yandexDisk.toLowerCase()}
						text={t("yandex-disk.log-in")}
						onClick={async () => {
							if (token) return;
							createChildWindow(
								`${authServiceUrl}/yandexdisk?redirect=${page?.domain}${page?.conf.basePath ?? ""}`,
								450,
								500,
								"https://disk.yandex.ru/client/disk",
								(location) => setToken(parserQuery(location.search)),
							);

							if (getExecutingEnvironment() == "browser") setToken(parserQuery(await waitForTempToken()));
						}}
					/>
				)}
			</div>
			<div className="buttons">
				<Button
					disabled={!token}
					onClick={() => {
						onSubmit({
							sourceType: SourceType.yandexDisk,
							domain: user.name,
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

export default CreateYandexDiskSourceData;
