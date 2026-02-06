import Icon from "@components/Atoms/Icon";
import parseStorageUrl from "@core/utils/parseStorageUrl";
import PageDataContext from "@core-ui/ContextServices/PageDataContext";
import { useDebounce } from "@core-ui/hooks/useDebounce";
import { useSetFooterButton } from "@core-ui/hooks/useFooterPortal";
import GitVerseSourceAPI from "@ext/git/actions/Source/GitVerse/logic/GitVerseSourceAPI";
import GitVerseSourceData from "@ext/git/actions/Source/GitVerse/logic/GitVerseSourceData";
import handleFormApiError from "@ext/git/actions/Source/logic/handleApiError";
import validateToken from "@ext/git/actions/Source/logic/validateToken";
import t from "@ext/localization/locale/translate";
import SourceType from "@ext/storage/logic/SourceDataProvider/model/SourceType";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@ui-kit/Button";
import { Retry } from "@ui-kit/ErrorState";
import { Form, FormField, FormFieldSet, FormSectionHeaderButton, FormSectionTitle, FormStack } from "@ui-kit/Form";
import { SecretInput, TextInput } from "@ui-kit/Input";
import { Skeleton } from "@ui-kit/Skeleton";
import { Tooltip, TooltipContent, TooltipTrigger } from "@ui-kit/Tooltip";
import { useEffect, useLayoutEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

const GITVERSE_URL = "gitverse.ru";
const GITVERSE_SETTINGS_TOKENS_URL = `https://${GITVERSE_URL}/settings/tokens`;

interface EditGitVerseProps {
	data?: Partial<GitVerseSourceData>;
	onSubmit: (data: GitVerseSourceData) => void;
}

const getFormSchema = () =>
	z.object({
		url: z.string({ message: t("must-be-not-empty") }).default(`https://${GITVERSE_URL}`),
		authorName: z.string({ message: t("must-be-not-empty") }),
		authorEmail: z.string({ message: t("must-be-not-empty") }),
		token: z.string({ message: t("must-be-not-empty") }).refine((val) => validateToken(val), {
			message: t("invalid2") + " " + t("token"),
		}),
	});

const EditGitVerse = ({ onSubmit, data }: EditGitVerseProps) => {
	const authServiceUrl = PageDataContext.value.conf.authServiceUrl;
	const { setPrimaryButton } = useSetFooterButton();
	const [isLoading, setIsLoading] = useState(false);

	const form = useForm({
		resolver: zodResolver(getFormSchema()),
		defaultValues: data
			? {
					url: `${data?.protocol ? data.protocol : "https"}://${data?.domain || GITVERSE_URL}`,
					token: data?.token,
					authorName: data?.userName,
					authorEmail: data?.userEmail,
				}
			: undefined,
		mode: "onChange",
	});

	const { start: startCheck, cancel: cancelCheck } = useDebounce(
		async (data: GitVerseSourceData, domain: string) => {
			if (data.token && domain) {
				const api = new GitVerseSourceAPI(data, authServiceUrl, (error) => {
					handleFormApiError(error, form);
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
		formValues.url = `https://${GITVERSE_URL}`;

		if (!formValues.token) {
			cancelCheck();
			setIsLoading(false);
			return;
		}

		setIsLoading(true);
		const hasProtocol = formValues.url.includes("://");
		const { protocol, origin, pathname } = parseStorageUrl(
			hasProtocol ? formValues.url : "https://" + formValues.url,
		);

		startCheck(
			{
				url: formValues.url,
				token: formValues.token,
				sourceType: SourceType.gitVerse,
				domain: GITVERSE_URL,
				userName: "",
				userEmail: "",
				protocol,
				origin,
				pathname,
			} as GitVerseSourceData,
			GITVERSE_URL,
		);
	};

	const formSubmit = (e) => {
		form.handleSubmit((data) => {
			const hasProtocol = data.url.includes("://");
			const { protocol } = parseStorageUrl(hasProtocol ? data.url : "https://" + data.url);
			const isInvalid = !!form.formState.errors.token?.message || !!form.formState.errors.url?.message;

			onSubmit({
				sourceType: SourceType.gitVerse,
				token: data.token,
				userName: data.authorName,
				userEmail: data.authorEmail,
				domain: GITVERSE_URL,
				protocol,
				createDate: new Date().toJSON(),
				isInvalid,
			});
		})(e);
	};

	useLayoutEffect(() => {
		const primaryButton = (
			<Button onClick={formSubmit} type="submit">
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
					<div className="flex flex-row items-center justify-between gap-3 pb-2 lg:gap-4">
						<FormSectionTitle>{t("authorization")}</FormSectionTitle>
						<FormSectionHeaderButton size="xs" type="button" variant="link">
							<a href={GITVERSE_SETTINGS_TOKENS_URL} rel="noreferrer" target="_blank">
								{`${t("create")} ${t("token")}`}
							</a>
							<Tooltip>
								<TooltipTrigger asChild>
									<Icon code="info" />
								</TooltipTrigger>
								<TooltipContent>
									<span
										dangerouslySetInnerHTML={{
											__html: t("git.source.gitverse.info"),
										}}
									/>
								</TooltipContent>
							</Tooltip>
						</FormSectionHeaderButton>
					</div>

					<FormFieldSet style={{ marginTop: 0 }}>
						<FormField
							control={({ field }) => (
								<SecretInput
									{...field}
									data-qa="qa-gitverse-token"
									onChange={(value) => {
										field.onChange(value);
										onChangeAuthFields();
									}}
									placeholder={t("forms.gitverse-source-data.props.token.placeholder")}
									showClearIcon
								/>
							)}
							description={t("forms.gitverse-source-data.props.token.description")}
							layout="vertical"
							name="token"
							title={t("forms.gitverse-source-data.props.token.name")}
						/>
						{form.formState.errors?.token?.type === "invalid" && (
							<div className="flex" style={{ marginTop: "-1.5em" }}>
								<Retry
									className="p-0 ml-auto"
									onClick={() => {
										onChangeAuthFields();
										form.clearErrors("token");
										form.clearErrors("url");
									}}
									startIcon="rotate-ccw"
									type="button"
								>
									{t("try-again")}
								</Retry>
							</div>
						)}

						<FormField
							control={({ field }) =>
								isLoading ? (
									<Skeleton className="w-full" style={{ height: "36px" }} />
								) : (
									<TextInput
										{...field}
										placeholder={
											isLoading
												? t("loading")
												: t("forms.gitverse-source-data.props.userName.placeholder")
										}
									/>
								)
							}
							description={t("forms.gitverse-source-data.props.userName.description")}
							layout="vertical"
							name="authorName"
							title={t("forms.gitverse-source-data.props.userName.name")}
						/>

						<FormField
							control={({ field }) =>
								isLoading ? (
									<Skeleton className="w-full" style={{ height: "36px" }} />
								) : (
									<TextInput
										{...field}
										placeholder={
											isLoading
												? t("loading")
												: t("forms.gitverse-source-data.props.userEmail.placeholder")
										}
									/>
								)
							}
							description={t("forms.gitverse-source-data.props.userEmail.description")}
							layout="vertical"
							name="authorEmail"
							title={t("forms.gitverse-source-data.props.userEmail.name")}
						/>
					</FormFieldSet>
				</FormStack>
			</form>
		</Form>
	);
};

export default EditGitVerse;
