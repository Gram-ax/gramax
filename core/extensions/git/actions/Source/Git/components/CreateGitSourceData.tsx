import Form from "@components/Form/Form";
import GitSourceFormData from "@ext/git/actions/Source/Git/GitSourceFormData";
import GitSourceData from "@ext/git/core/model/GitSourceData.schema";
import t from "@ext/localization/locale/translate";
import { JSONSchema7 } from "json-schema";
import { useState } from "react";
import parseStorageUrl from "../../../../../../logic/utils/parseStorageUrl";
import Schema from "../../../../core/model/GitSourceData.schema.json";

Schema.required = ["url", ...Schema.required];
Schema.properties = {
	_: "separator",
	url: { type: "string" },
	token: Schema.properties.token,
	__: "separator",
	userName: Schema.properties.userName,
	userEmail: Schema.properties.userEmail,
} as any;

const CreateGitSourceData = ({
	onSubmit,
	props,
	readOnlyProps,
}: {
	onSubmit?: (editProps: GitSourceData) => void;
	props: GitSourceData;
	readOnlyProps?: { [key: string]: string };
}) => {
	const [thisProps, setThisProps] = useState(props);
	const invalidMailText = t("error-mail");
	const invalidDomainText = t("invalid") + " " + t("value");

	const submit = (data: GitSourceData) => {
		if (onSubmit) onSubmit(data);
	};

	const onChange = (data: GitSourceFormData) => {
		const { domain, protocol } = parseStorageUrl(data.url);
		if (domain && protocol) {
			data.domain = domain;
			data.protocol = protocol;
			data.url = `${protocol}://${domain}`;
			setThisProps({ ...data });
		}
	};

	const newSchema = { ...Schema };
	newSchema.properties = { ...newSchema.properties };
	Object.keys(readOnlyProps ?? {}).forEach((key) => {
		if (newSchema.properties?.[key]) newSchema.properties[key] = { readOnly: true, ...newSchema.properties[key] };
	});

	return (
		<Form<GitSourceFormData>
			initStyles={false}
			schema={newSchema as JSONSchema7}
			props={thisProps}
			onSubmit={submit}
			onChange={onChange}
			fieldDirection="row"
			submitText={t("add")}
			validate={(data) => {
				const { protocol, domain } = parseStorageUrl(data.url);
				const isErrorEmail = !/.*@.*\..+/.test(data?.userEmail);
				return {
					url:
						data.url && (!domain || !protocol) && protocol !== "http" && protocol !== "https"
							? invalidDomainText
							: null,
					userEmail: isErrorEmail ? invalidMailText : null,
				};
			}}
		/>
	);
};

export default CreateGitSourceData;
