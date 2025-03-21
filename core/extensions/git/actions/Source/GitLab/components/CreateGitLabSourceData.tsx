import Form from "@components/Form/Form";
import PageDataContextService from "@core-ui/ContextServices/PageDataContext";
import { useDebounce } from "@core-ui/hooks/useDebounce";
import NetworkApiError from "@ext/errorHandlers/network/NetworkApiError";
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

type LoadingFields = { [key: string]: boolean };

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
	const [thisProps, setThisProps] = useState<GitlabSourceFormData>(props);
	const [formErrors, setFormErrors] = useState({ url: null as string, token: null as string });
	const [loadingFields, setLoadingFields] = useState<LoadingFields>({
		userName: false,
		userEmail: false,
	});
	const invalidValueText = t("invalid") + " " + t("value");
	const invalidTokenText = t("invalid2") + " " + t("token");
	const authServiceUrl = PageDataContextService.value.conf.authServiceUrl;

	const { start: startCheck } = useDebounce(
		async (data: GitlabSourceData, errors: { url: string; token: string }, domain: string) => {
			if (data.token && domain) {
				const api = new GitlabSourceAPI(data, authServiceUrl, (error) => {
					if (error instanceof NetworkApiError) {
						if (error.props.status == 401 || error.props.status == 403) {
							errors.token = invalidTokenText;
						} else {
							errors.url = invalidValueText;
						}
					}
					setLoading(false);
				});

				const user = await api.getUser();
				if (!data.userName || !data.userEmail) {
					data.userName = user.name;
					data.userEmail = user.email;
					setThisProps({ ...data });
				}

				setFormErrors(errors);
				setLoading(false);
			}
		},
		500,
	);

	const setLoading = (isLoading: boolean) => {
		setLoadingFields({
			userName: isLoading,
			userEmail: isLoading,
		});
	};

	const submit = (data: GitlabSourceData) => {
		if (onSubmit) onSubmit(data);
	};

	const onChange = (data: GitlabSourceFormData) => {
		const errors = { url: null as string, token: null as string };
		const { domain, protocol, origin, pathname } = parseStorageUrl(data.url);


		if (domain && protocol && origin && !domain.startsWith("http") && pathname?.length === 0) {
			data.domain = domain;
			data.protocol = protocol;
		}

		if (!data.url && (!domain || !protocol || domain.startsWith("http"))) {
			errors.url = invalidValueText;
		}

		if (
			(data.url && (!domain || !protocol) && protocol !== "http" && protocol !== "https") ||
			pathname?.length > 0
		) {
			errors.url = invalidValueText;
		}

		if (data.token && !validateToken(data.token)) {
			errors.token = invalidTokenText;
			setFormErrors(errors);
			setThisProps({ ...data });
			return;
		}

		setLoading(true);
		startCheck(data, errors, domain);

		setFormErrors(errors);
		setThisProps({ ...data });
	};

	const newSchema = { ...Schema };

	const gitlabDomain = `${thisProps.protocol || "https"}://${(!formErrors.url && thisProps.domain) || "gitlab.com"}`;

	newSchema.properties = { ...newSchema.properties };

	if (!thisProps.domain || formErrors.url) {
		delete newSchema.properties.token;
	}

	if (!newSchema.properties.token || !thisProps.token || formErrors.token) {
		delete newSchema.properties.userName;
		delete newSchema.properties.userEmail;
	}

	if (newSchema.properties.token) {
		(newSchema.properties.token as JSONSchema7).description = t(
			"forms.gitlab-source-data.props.token.description",
		).replace("{{create_token_url}}", `${gitlabDomain}/-/user_settings/personal_access_tokens`);
	}

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
