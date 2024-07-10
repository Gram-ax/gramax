import Form from "@components/Form/Form";
import PageDataContextService from "@core-ui/ContextServices/PageDataContext";
import type GitlabSourceData from "@ext/git/actions/Source/GitLab/logic/GitlabSourceData";
import { JSONSchema7 } from "json-schema";
import { useState } from "react";
import parseStorageUrl from "../../../../../../logic/utils/parseStorageUrl";
import useLocalize from "../../../../../localization/useLocalize";
import Schema from "../../../../core/model/GitSourceData.schema.json";
import GitlabSourceAPI from "../logic/GitlabSourceAPI";

Schema.properties = {
	_: "separator",
	domain: Schema.properties.domain,
	token: Schema.properties.token,
	__: "separator",
	userName: Schema.properties.userName,
	userEmail: Schema.properties.userEmail,
} as any;

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
	const invalidValueText = useLocalize("invalid") + " " + useLocalize("value");
	const invalidTokenText = useLocalize("invalid2") + " " + useLocalize("token");
	const authServiceUrl = PageDataContextService.value.conf.authServiceUrl;

	const submit = (data: GitlabSourceData) => {
		if (onSubmit) onSubmit(data);
	};

	const onChange = async (data: GitlabSourceData) => {
		const domain = parseStorageUrl(data.domain).domain;

		if (data.token && domain) {
			if (data.domain !== domain) {
				data.domain = domain;
				setThisProps({ ...data });
			}
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
		<Form<GitlabSourceData>
			initStyles={false}
			schema={newSchema as JSONSchema7}
			props={thisProps}
			onSubmit={submit}
			onChange={onChange}
			fieldDirection="row"
			submitText={useLocalize("add")}
			validate={async (data) => {
				const parseDomain = parseStorageUrl(data.domain).domain;
				const isErrorToken =
					data.token && parseDomain
						? !(await new GitlabSourceAPI(data, authServiceUrl).isCredentialsValid())
						: false;

				return {
					domain: data.domain && !parseDomain ? invalidValueText : null,
					token: isErrorToken ? invalidTokenText : null,
				};
			}}
		/>
	);
};

export default CreateGitLabSourceData;
