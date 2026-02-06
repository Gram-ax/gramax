import Button, { TextSize } from "@components/Atoms/Button/Button";
import { ButtonStyle } from "@components/Atoms/Button/ButtonStyle";
import ButtonLink from "@components/Molecules/ButtonLink";
import Query, { parserQuery } from "@core/Api/Query";
import createChildWindow from "@core-ui/ChildWindow/createChildWindow";
import PageDataContextService from "@core-ui/ContextServices/PageDataContext";
import t from "@ext/localization/locale/translate";
import NotionSourceData from "@ext/notion/model/NotionSourceData";
import User2 from "@ext/security/components/User/User2";
import SourceType from "@ext/storage/logic/SourceDataProvider/model/SourceType";
import { useState } from "react";

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
						buttonStyle={ButtonStyle.default}
						className="input-lable"
						fullWidth
						iconCode={SourceType.notion.toLowerCase()}
						iconFw={false}
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
						text={t("log-in") + "Notion"}
						textSize={TextSize.M}
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
