import t from "@ext/localization/locale/translate";
import Icon from "@components/Atoms/Icon";
import { Field } from "@ui-kit/Field";
import { Button } from "@ui-kit/Button";
import createChildWindow from "@core-ui/ChildWindow/createChildWindow";
import PageDataContext from "@core-ui/ContextServices/PageDataContext";
import { useState, useLayoutEffect } from "react";
import { useSetFooterButton } from "@core-ui/hooks/useFooterPortal";
import Query, { parserQuery } from "@core/Api/Query";
import SourceType from "@ext/storage/logic/SourceDataProvider/model/SourceType";
import { TextInput } from "@ui-kit/Input";
import NotionSourceData from "@ext/notion/model/NotionSourceData";

const EditNotion = ({ onSubmit }: { onSubmit: (data: NotionSourceData) => void }) => {
	const { setPrimaryButton } = useSetFooterButton();
	const {
		domain,
		conf: { authServiceUrl, basePath },
	} = PageDataContext.value;
	const [data, setData] = useState<Query>(null);

	const startAuth = () => {
		if (data) return;

		createChildWindow(
			`${authServiceUrl}/notion?redirect=${domain}${basePath ?? ""}`,
			450,
			500,
			"https://www.notion.so",
			(location) => setData(parserQuery(location.search)),
		);
	};

	useLayoutEffect(() => {
		const handleAddRepo = () => {
			if (data) {
				onSubmit({
					sourceType: SourceType.notion,
					workspaceName: data.workspace_name,
					workspaceId: data.workspace_id,
					token: data.access_token,
					userName: data.user_name,
					userEmail: data.user_id,
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
						<TextInput className="font-medium" value={data.userName} readOnly />
					) : (
						<Button type="button" variant="outline" onClick={startAuth}>
							<Icon code="notion" className="text-base" />
							{t("log-in")}
							Notion
						</Button>
					)
				}
			/>
		</>
	);
};

export default EditNotion;
