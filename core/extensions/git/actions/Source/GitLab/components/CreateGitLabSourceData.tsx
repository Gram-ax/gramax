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
import debounceFunction from "@core-ui/debounceFunction";
import NetworkApiError from "@ext/errorHandlers/network/NetworkApiError";

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

type LoadingFields = { [key: string]: boolean };

const GITLAB_DEBOUNCE_SYMBOL = Symbol();

const validateToken = (token: string) => {
	// eslint-disable-next-line no-control-regex
	const hasNonISOChars = /[^\x00-\xFF]/.test(token);
	return !hasNonISOChars;
};

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
	const [formErrors, setFormErrors] = useState({ url: null as string, token: null as string });
	const [loadingFields, setLoadingFields] = useState<LoadingFields>({
		userName: false,
		userEmail: false,
	});
	const invalidValueText = t("invalid") + " " + t("value");
	const invalidTokenText = t("invalid2") + " " + t("token");
	const authServiceUrl = PageDataContextService.value.conf.authServiceUrl;

	const setLoading = (isLoading: boolean) => {
		setLoadingFields({
			userName: isLoading,
			userEmail: isLoading,
		});
	};

	const submit = (data: GitlabSourceData) => {
		if (onSubmit) onSubmit(data);
	};

	const onChange = async (data: GitlabSourceFormData) => {
		const errors = { url: null as string, token: null as string };
		const { domain, protocol, origin } = parseStorageUrl(data.url);

		if (domain && protocol) {
			data.domain = domain;
			data.protocol = protocol;
			data.url = origin;
		}

		if (data.url && (!domain || !protocol) && protocol !== "http" && protocol !== "https") {
			errors.url = invalidValueText;
		}

		if (data.token && !validateToken(data.token)) {
			errors.token = invalidTokenText;
			setFormErrors(errors);
			setThisProps({ ...data });
			return;
		}

		setLoading(true);

		await new Promise((resolve) =>
			debounceFunction(
				GITLAB_DEBOUNCE_SYMBOL,
				async () => {
					if (data.token && domain) {
						const api = new GitlabSourceAPI(data, authServiceUrl, (error) => {
							if (
								error instanceof NetworkApiError &&
								(error.props.status == 401 || error.props.status == 403)
							) {
								errors.token = invalidTokenText;
							}
							setLoading(false);
							resolve(undefined);
						});

						const user = await api.getUser();
						if (!data.userName || !data.userEmail) {
							data.userName = user.name;
							data.userEmail = user.email;
						}
					}
					setLoading(false);
					resolve(undefined);
				},
				500
			)
		);

		setFormErrors(errors);
		setThisProps({ ...data });
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
			validate={() => formErrors}
			loadingFields={loadingFields}
		/>
	);
};

export default CreateGitLabSourceData;
