import Icon from "@components/Atoms/Icon";
import PageDataContext from "@core-ui/ContextServices/PageDataContext";
import { useDebounce } from "@core-ui/hooks/useDebounce";
import { useSetFooterButton } from "@core-ui/hooks/useFooterPortal";
import parseStorageUrl from "@core/utils/parseStorageUrl";
import NetworkApiError from "@ext/errorHandlers/network/NetworkApiError";
import GitlabSourceAPI from "@ext/git/actions/Source/GitLab/logic/GitlabSourceAPI";
import GitlabSourceData from "@ext/git/actions/Source/GitLab/logic/GitlabSourceData";
import validateToken from "@ext/git/actions/Source/logic/validateToken";
import t from "@ext/localization/locale/translate";
import SourceType from "@ext/storage/logic/SourceDataProvider/model/SourceType";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@ui-kit/Button";
import { Retry } from "@ui-kit/ErrorState";
import {
	Form,
	FormDivider,
	FormField,
	FormFieldSet,
	FormSectionHeaderButton,
	FormSectionTitle,
	FormStack,
} from "@ui-kit/Form";
import { Input, SecretInput, TextInput } from "@ui-kit/Input";
import { Skeleton } from "@ui-kit/Skeleton";
import { Tooltip, TooltipContent, TooltipTrigger } from "@ui-kit/Tooltip";
import { useEffect, useLayoutEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

interface EditGitLabProps {
	data?: Partial<GitlabSourceData>;
	onSubmit: (data: GitlabSourceData) => void;
}

const getFormSchema = () =>
	z.object({
		url: z.string({ message: t("must-be-not-empty") }),
		authorName: z.string({ message: t("must-be-not-empty") }),
		authorEmail: z.string({ message: t("must-be-not-empty") }),
		token: z.string({ message: t("must-be-not-empty") }).refine((val) => validateToken(val), {
			message: t("invalid2") + " " + t("token"),
		}),
	});

const getGitlabSettingsUrl = (domain: string) => {
	const hasProtocol = domain.includes("://");
	return `${hasProtocol ? domain : "https://" + domain}/-/user_settings/personal_access_tokens`;
};

const EditGitLab = ({ onSubmit, data }: EditGitLabProps) => {
	const authServiceUrl = PageDataContext.value.conf.authServiceUrl;
	const { setPrimaryButton } = useSetFooterButton();
	const [isLoading, setIsLoading] = useState(false);

	const form = useForm({
		resolver: zodResolver(getFormSchema()),
		defaultValues: data
			? {
					url: `${data?.protocol ? data.protocol : "https"}://${data?.domain}`,
					token: data?.token,
					authorName: data?.userName,
					authorEmail: data?.userEmail,
			  }
			: undefined,
		mode: "onChange",
	});

	const url = form.watch("url");

	const { start: startCheck, cancel: cancelCheck } = useDebounce(
		async (data: GitlabSourceData, domain: string) => {
			if (data.token && domain) {
				const api = new GitlabSourceAPI(data, authServiceUrl, (error) => {
					if (!(error instanceof NetworkApiError)) return;

					if (error.props.status == 401 || error.props.status == 403)
						form.setError("token", { type: "invalid", message: t("invalid2") + " " + t("token") });
					else form.setError("url", { message: t("invalid") + " " + t("value") });

					setIsLoading(false);
				});

				const user = await api.getUser();
				form.setValue("authorName", user.name, { shouldDirty: true });
				form.setValue("authorEmail", user.email, { shouldDirty: true });
				setIsLoading(false);
			}
		},
		500,
		true,
	);

	useEffect(() => {
		if (data?.isInvalid) form.setError("token", { type: "invalid", message: t("invalid2") + " " + t("token") });
	}, [data?.isInvalid]);

	const onChangeAuthFields = () => {
		const formValues = form.getValues();

		if (!formValues.token || !formValues.url) {
			cancelCheck();
			setIsLoading(false);
			return;
		}

		setIsLoading(true);
		const hasProtocol = formValues.url.includes("://");
		const { domain, protocol, origin, pathname } = parseStorageUrl(
			hasProtocol ? formValues.url : "https://" + formValues.url,
		);
		startCheck(
			{
				url: formValues.url,
				token: formValues.token,
				sourceType: SourceType.gitLab,
				domain,
				userName: "",
				userEmail: "",
				protocol,
				origin,
				pathname,
			} as GitlabSourceData,
			domain,
		);
	};

	const formSubmit = (e) => {
		form.handleSubmit((formData) => {
			const hasProtocol = formData.url.includes("://");
			const { domain, protocol } = parseStorageUrl(hasProtocol ? formData.url : "https://" + formData.url);
			const isInvalid = !!form.formState.errors.token?.message || !!form.formState.errors.url?.message;

			onSubmit({
				sourceType: SourceType.gitLab,
				token: formData.token,
				userName: formData.authorName,
				userEmail: formData.authorEmail,
				domain,
				protocol,
				createDate: new Date().toJSON(),
				isInvalid,
			});
		})(e);
	};

	useLayoutEffect(() => {
		const primaryButton = (
			<Button type="submit" onClick={formSubmit}>
				{t("add")}
			</Button>
		);

		setPrimaryButton(primaryButton);

		return () => {
			setPrimaryButton(null);
		};
	}, []);

	return (
		<Form asChild {...form}>
			<form className="contents ui-kit" onSubmit={formSubmit}>
				<FormStack>
					<FormField
						name="url"
						title={t("forms.gitlab-source-data.props.url.name")}
						layout="vertical"
						readonly={!!data?.domain}
						description={t("forms.gitlab-source-data.props.url.description")}
						control={({ field }) => (
							<Input
								{...field}
								readOnly={!!data?.domain}
								data-qa="qa-gitlab-url"
								placeholder={t("forms.gitlab-source-data.props.url.placeholder")}
								onChange={(value) => {
									field.onChange(value);
									onChangeAuthFields();
								}}
							/>
						)}
					/>

					<FormDivider />

					<div className="flex flex-row items-center justify-between gap-3 pb-2 lg:gap-4">
						<FormSectionTitle>{t("authorization")}</FormSectionTitle>
						<FormSectionHeaderButton size="xs" variant="link" type="button">
							<a
								href={getGitlabSettingsUrl(url || "https://gitlab.com")}
								target="_blank"
								rel="noopener noreferrer"
							>
								{`${t("create")} ${t("token")}`}
							</a>
							<Tooltip>
								<TooltipTrigger asChild>
									<Icon code="info" />
								</TooltipTrigger>
								<TooltipContent>
									<span
										dangerouslySetInnerHTML={{
											__html: t("git.source.gitlab.info"),
										}}
									/>
								</TooltipContent>
							</Tooltip>
						</FormSectionHeaderButton>
					</div>

					<FormFieldSet style={{ marginTop: 0 }}>
						<FormField
							name="token"
							title={t("forms.gitlab-source-data.props.token.name")}
							layout="vertical"
							description={t("forms.gitlab-source-data.props.token.description")}
							control={({ field }) => (
								<SecretInput
									{...field}
									data-qa="qa-gitlab-token"
									onChange={(value) => {
										field.onChange(value);
										onChangeAuthFields();
									}}
									showClearIcon
									placeholder={t("forms.gitlab-source-data.props.token.placeholder")}
								/>
							)}
						/>
						{form.formState.errors?.token?.type === "invalid" && (
							<div className="flex" style={{ marginTop: "-1.5em" }}>
								<Retry
									type="button"
									startIcon="rotate-ccw"
									className="p-0 ml-auto"
									size="xs"
									onClick={() => {
										onChangeAuthFields();
										form.clearErrors("token");
										form.clearErrors("url");
									}}
								>
									{t("try-again")}
								</Retry>
							</div>
						)}

						<FormField
							name="authorName"
							title={t("forms.gitlab-source-data.props.userName.name")}
							layout="vertical"
							description={t("forms.gitlab-source-data.props.userName.description")}
							control={({ field }) =>
								isLoading ? (
									<Skeleton className="w-full" style={{ height: "36px" }} />
								) : (
									<TextInput
										{...field}
										placeholder={
											isLoading
												? t("loading")
												: t("forms.gitlab-source-data.props.userName.placeholder")
										}
									/>
								)
							}
						/>

						<FormField
							name="authorEmail"
							title={t("forms.gitlab-source-data.props.userEmail.name")}
							layout="vertical"
							description={t("forms.gitlab-source-data.props.userEmail.description")}
							control={({ field }) =>
								isLoading ? (
									<Skeleton className="w-full" style={{ height: "36px" }} />
								) : (
									<TextInput
										{...field}
										placeholder={
											isLoading
												? t("loading")
												: t("forms.gitlab-source-data.props.userEmail.placeholder")
										}
									/>
								)
							}
						/>
					</FormFieldSet>
				</FormStack>
			</form>
		</Form>
	);
};

export default EditGitLab;
