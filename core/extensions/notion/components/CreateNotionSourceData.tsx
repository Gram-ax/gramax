import Button, { TextSize } from "@components/Atoms/Button/Button";
import Query, { parserQuery } from "@core/Api/Query";
import t from "@ext/localization/locale/translate";
import User2 from "@ext/security/components/User/User2";
import { useState } from "react";
import ButtonLink from "@components/Molecules/ButtonLink";
import { ButtonStyle } from "@components/Atoms/Button/ButtonStyle";
import createChildWindow from "@core-ui/ChildWindow/createChildWindow";
import SourceType from "@ext/storage/logic/SourceDataProvider/model/SourceType";
import PageDataContextService from "@core-ui/ContextServices/PageDataContext";
import NotionSourceData from "@ext/notion/model/NotionSourceData";

const CreateNotionSourceData = ({ onSubmit }: { onSubmit?: (editProps: NotionSourceData) => void }) => {
	const page = PageDataContextService.value;
	const authServiceUrl = PageDataContextService.value.conf.authServiceUrl;
	const [data, setData] = useState<Query>(null);

	return (
		<>
			<div className="form-group field field-string row field-height">
				<div className="control-label">{t("user")}</div>
				{data ? (
					<div className="input-lable">
						<div className="input-lable">
							<User2 name={data.user_name} />
						</div>
					</div>
				) : (
					<ButtonLink
						fullWidth
						className="input-lable"
						buttonStyle={ButtonStyle.default}
						textSize={TextSize.M}
						iconFw={false}
						iconCode={SourceType.notion.toLowerCase()}
						text={t("log-in") + "Notion"}
						onClick={() => {
							if (data) return;
							createChildWindow(
								`${authServiceUrl}/notion?redirect=${page?.domain}${page?.conf.basePath ?? ""}`,
								450,
								500,
								"https://www.notion.so",
								(location) => setData(parserQuery(location.search)),
							);
						}}
					/>
				)}
			</div>
			<div className="buttons">
				<Button
					disabled={!data}
					onClick={() => {
						onSubmit({
							sourceType: SourceType.notion,
							workspaceName: data.workspace_name,
							workspaceId: data.workspace_id,
							token: data.access_token,
							userName: data.user_name,
							userEmail: data.user_id,
						});
					}}
				>
					{t("add")}
				</Button>
			</div>
		</>
	);
};

export default CreateNotionSourceData;
