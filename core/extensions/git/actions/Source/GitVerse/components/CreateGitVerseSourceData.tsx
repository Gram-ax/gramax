import Form from "@components/Form/Form";
import PageDataContextService from "@core-ui/ContextServices/PageDataContext";
import { useDebounce } from "@core-ui/hooks/useDebounce";
import NetworkApiError from "@ext/errorHandlers/network/NetworkApiError";
import GitSourceFormData from "@ext/git/actions/Source/Git/GitSourceFormData";
import GitVerseSourceAPI from "@ext/git/actions/Source/GitVerse/logic/GitVerseSourceAPI";
import type GitVerseSourceData from "@ext/git/actions/Source/GitVerse/logic/GitVerseSourceData";
import Schema from "@ext/git/actions/Source/GitVerse/model/GitVerseSourceData.schema.json";
import t from "@ext/localization/locale/translate";
import SourceType from "@ext/storage/logic/SourceDataProvider/model/SourceType";
import { JSONSchema7 } from "json-schema";
import { useState } from "react";
import parseStorageUrl from "../../../../../../logic/utils/parseStorageUrl";

Schema.required = ["url", ...Schema.required];
Schema.properties = {
	_: "separator",
	token: Schema.properties.token,
	__: "separator",
	userName: Schema.properties.userName,
	userEmail: Schema.properties.userEmail,
} as any;

interface GitVerseSourceFormData extends GitSourceFormData {
	sourceType: SourceType.gitVerse;
}

type LoadingFields = { [key: string]: boolean };

const validateToken = (token: string) => {
	// eslint-disable-next-line no-control-regex
	const hasNonISOChars = /[^\x00-\xFF]/.test(token);
	return !hasNonISOChars;
};

const CreateGitVerseSourceData = ({
	onSubmit,
	props,
	readOnlyProps,
}: {
	onSubmit?: (editProps: GitVerseSourceData) => void;
	props: GitVerseSourceData;
	readOnlyProps?: { [key: string]: string };
}) => {
	const [thisProps, setThisProps] = useState<GitVerseSourceFormData>(props);
	const [formErrors, setFormErrors] = useState({ url: null as string, token: null as string });
	const [loadingFields, setLoadingFields] = useState<LoadingFields>({
		userName: false,
		userEmail: false,
	});
	const invalidValueText = t("invalid") + " " + t("value");
	const invalidTokenText = t("invalid2") + " " + t("token");
	const authServiceUrl = PageDataContextService.value.conf.authServiceUrl;

	const { start: startCheck } = useDebounce(
		async (data: GitVerseSourceData, errors: { url: string; token: string }, domain: string) => {
			if (data.token && domain) {
				const api = new GitVerseSourceAPI(data, authServiceUrl, (error) => {
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

	const submit = (data: GitVerseSourceData) => {
		if (onSubmit) onSubmit(data);
	};

	const onChange = (data: GitVerseSourceFormData) => {
		data.url = "https://gitverse.ru";
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

	newSchema.properties = { ...newSchema.properties };

	if (!newSchema.properties.token || !thisProps.token || formErrors.token || formErrors.url) {
		delete newSchema.properties.userName;
		delete newSchema.properties.userEmail;
	}

	Object.keys(readOnlyProps ?? {}).forEach((key) => {
		if (newSchema.properties?.[key]) newSchema.properties[key] = { readOnly: true, ...newSchema.properties[key] };
	});

	return (
		<Form<GitVerseSourceFormData>
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

export default CreateGitVerseSourceData;
