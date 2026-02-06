import Icon from "@components/Atoms/Icon";
import Query, { parserQuery } from "@core/Api/Query";
import createChildWindow from "@core-ui/ChildWindow/createChildWindow";
import PageDataContext from "@core-ui/ContextServices/PageDataContext";
import { useSetFooterButton } from "@core-ui/hooks/useFooterPortal";
import t from "@ext/localization/locale/translate";
import NotionSourceData from "@ext/notion/model/NotionSourceData";
import SourceType from "@ext/storage/logic/SourceDataProvider/model/SourceType";
import { Button } from "@ui-kit/Button";
import { Field } from "@ui-kit/Field";
import { TextInput } from "@ui-kit/Input";
import { useLayoutEffect, useState } from "react";

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
						<TextInput className="font-medium" readOnly value={data.userName} />
					) : (
						<Button onClick={startAuth} type="button" variant="outline">
							<Icon className="text-base" code="notion" />
							{t("log-in")}
							Notion
						</Button>
					)
				}
				layout="vertical"
				title={t("user")}
			/>
		</>
	);
};

export default EditNotion;
