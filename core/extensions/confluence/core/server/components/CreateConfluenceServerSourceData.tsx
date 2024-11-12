import Form from "@components/Form/Form";
import parseStorageUrl from "@core/utils/parseStorageUrl";
import ConfluenceServerAPI from "@ext/confluence/core/api/ConfluenceServerAPI";
import ConfluenceServerSourceData from "@ext/confluence/core/server/model/ConfluenceServerSourceData.schema";
import ErrorConfirmService from "@ext/errorHandlers/client/ErrorConfirmService";
import DefaultError from "@ext/errorHandlers/logic/DefaultError";
import t from "@ext/localization/locale/translate";
import { JSONSchema7 } from "json-schema";
import { useState } from "react";
import Schema from "../../../core/server/model/ConfluenceServerSourceData.schema.json";

Schema.properties = {
	_: "separator",
	domain: Schema.properties.domain,
	token: Schema.properties.token,
} as any;

const CreateConfluenceServerSourceData = ({
	onSubmit,
	props,
	readOnlyProps,
}: {
	onSubmit?: (editProps: ConfluenceServerSourceData) => void;
	props: ConfluenceServerSourceData;
	readOnlyProps?: { [key: string]: string };
}) => {
	const [thisProps, setThisProps] = useState(props);
	const invalidCredentialsTitle = t("invalid-credentials-title");
	const invalidCredentialsText = t("invalid-credentials-text");
	const invalidDomainText = t("invalid") + " " + t("value");

	const submit = async (data: ConfluenceServerSourceData) => {
		if (!(await new ConfluenceServerAPI(data).getUser()))
			return ErrorConfirmService.notify(
				new DefaultError(invalidCredentialsText, null, {}, false, invalidCredentialsTitle),
			);

		if (onSubmit) onSubmit(data);
	};

	const onChange = (data: ConfluenceServerSourceData) => {
		const { origin } = parseStorageUrl(data.domain.trim());

		if (origin) {
			data.domain = origin;
			setThisProps({ ...data });
		}
	};

	const newSchema = { ...Schema };
	newSchema.properties = { ...newSchema.properties };
	Object.keys(readOnlyProps ?? {}).forEach((key) => {
		if (newSchema.properties?.[key]) newSchema.properties[key] = { readOnly: true, ...newSchema.properties[key] };
	});

	return (
		<Form<ConfluenceServerSourceData>
			initStyles={false}
			schema={newSchema as JSONSchema7}
			props={thisProps}
			onSubmit={submit}
			onChange={onChange}
			fieldDirection="row"
			submitText={t("add")}
			validate={(data) => {
				const { origin } = parseStorageUrl(data.domain);

				return {
					domain: data.domain && !origin ? invalidDomainText : null,
				};
			}}
		/>
	);
};

export default CreateConfluenceServerSourceData;
