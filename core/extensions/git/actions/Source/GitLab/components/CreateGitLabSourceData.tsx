import Form from "@components/Form/Form";
import PageDataContextService from "@core-ui/ContextServices/PageDataContext";
import GitSourceFormData from "@ext/git/actions/Source/Git/GitSourceFormData";
import type GitlabSourceData from "@ext/git/actions/Source/GitLab/logic/GitlabSourceData";
import t from "@ext/localization/locale/translate";
import SourceType from "@ext/storage/logic/SourceDataProvider/model/SourceType";
import { JSONSchema7 } from "json-schema";
import { useState } from "react";
import parseStorageUrl from "../../../../../../logic/utils/parseStorageUrl";
import Schema from "../../../../core/model/GitLabSourceData.schema.json";
import GitlabSourceAPI from "../logic/GitlabSourceAPI";

Schema.required = ["url", ...Schema.required];
Schema.properties = {
	_: "separator",
	url: { type: "string" },
	token: Schema.properties.token,
	__: "separator",
	userName: Schema.properties.userName,
	userEmail: Schema.properties.userEmail,
} as any;

interface GitlabSourceFormData extends GitSourceFormData {
	sourceType: SourceType.gitLab;
}

const CreateGitLabSourceData = ({
	onSubmit,
	props,
	readOnlyProps,
}: {
	onSubmit?: (editProps: GitlabSourceData) => void;
	props: GitlabSourceData;
	readOnlyProps?: { [key: string]: string };
}) => {
	const [thisProps, setThisProps] = useState(props);
	const invalidValueText = t("invalid") + " " + t("value");
	const invalidTokenText = t("invalid2") + " " + t("token");
	const authServiceUrl = PageDataContextService.value.conf.authServiceUrl;

	const submit = (data: GitlabSourceData) => {
		if (onSubmit) onSubmit(data);
	};

	const onChange = async (data: GitlabSourceFormData) => {
		const { domain, protocol, origin } = parseStorageUrl(data.url);

		if (domain && protocol) {
			data.domain = domain;
			data.protocol = protocol;
			data.url = origin;
			setThisProps({ ...data });
		}
		if (data.token && data.domain && data.protocol) {
			if (!data.userName || !data.userEmail) {
				const user = await new GitlabSourceAPI(data, authServiceUrl).getUser();
				if (!user) return;
				data.userName = user.name;
				data.userEmail = user.email;
				setThisProps({ ...data });
			}
		}
	};

	const newSchema = { ...Schema };
	newSchema.properties = { ...newSchema.properties };
	Object.keys(readOnlyProps ?? {}).forEach((key) => {
		if (newSchema.properties?.[key]) newSchema.properties[key] = { readOnly: true, ...newSchema.properties[key] };
	});

	return (
		<Form<GitlabSourceFormData>
			initStyles={false}
			schema={newSchema as JSONSchema7}
			props={thisProps}
			onSubmit={submit}
			onChange={onChange}
			fieldDirection="row"
			submitText={t("add")}
			validate={async (data) => {
				const { domain, protocol } = parseStorageUrl(data.url);
				const isErrorToken =
					data.token && domain
						? !(await new GitlabSourceAPI(data, authServiceUrl).isCredentialsValid())
						: false;

				return {
					url:
						data.url && (!domain || !protocol) && protocol !== "http" && protocol !== "https"
							? invalidValueText
							: null,
					token: isErrorToken ? invalidTokenText : null,
				};
			}}
		/>
	);
};

export default CreateGitLabSourceData;
