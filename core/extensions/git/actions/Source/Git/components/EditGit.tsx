import parseStorageUrl from "@core/utils/parseStorageUrl";
import { useSetFooterButton } from "@core-ui/hooks/useFooterPortal";
import useWatch from "@core-ui/hooks/useWatch";
import GitSourceData from "@ext/git/core/model/GitSourceData.schema";
import t from "@ext/localization/locale/translate";
import SourceType from "@ext/storage/logic/SourceDataProvider/model/SourceType";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@ui-kit/Button";
import {
	Form,
	FormDivider,
	FormField,
	FormFieldSet,
	FormSectionHeaderButton,
	FormSectionTitle,
	FormStack,
} from "@ui-kit/Form";
import { SecretInput, TextInput } from "@ui-kit/Input";
import { useLayoutEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

interface GitFormData {
	url: string;
	username: string;
	authorName: string;
	authorEmail: string;
	token: string;
}

const getFormSchema = () =>
	z.object({
		url: z.string({ message: t("must-be-not-empty") }),
		username: z.string({ message: t("must-be-not-empty") }).optional(),
		authorName: z.string({ message: t("must-be-not-empty") }),
		authorEmail: z.string({ message: t("must-be-not-empty") }),
		token: z.string({ message: t("must-be-not-empty") }),
	});

interface EditGitProps {
	data?: Partial<GitSourceData>;
	onSubmit: (data: GitSourceData) => void;
}

const getSourceDataByFormData = (formData: Partial<GitFormData>, isToken: boolean): GitSourceData => {
	const hasProtocol = formData.url.includes("://");
	const { domain, protocol } = parseStorageUrl(hasProtocol ? formData.url : "https://" + formData.url);

	return {
		sourceType: SourceType.git,
		token: formData.token,
		userName: formData.authorName,
		userEmail: formData.authorEmail,
		domain,
		protocol,
		createDate: new Date().toJSON(),
		gitServerUsername: !isToken ? (formData.username === "git" ? "" : formData.username) : "git",
	};
};

const GitForm = ({ data, onSubmit }: EditGitProps) => {
	const [isToken, setIsToken] = useState(true);
	const { setPrimaryButton } = useSetFooterButton();

	const isTokenRef = useRef(isToken);
	useWatch(() => {
		isTokenRef.current = isToken;
	}, [isToken]);

	const form = useForm({
		resolver: zodResolver(getFormSchema()),
		defaultValues: data
			? {
					url: `${data?.protocol ? data.protocol : "https"}://${data?.domain}`,
					username: data?.gitServerUsername,
					token: data?.token,
					authorName: data?.userName,
					authorEmail: data?.userEmail,
				}
			: undefined,
		mode: "onChange",
	});

	const formSubmit = (e) => {
		e.preventDefault();
		form.handleSubmit((data) => {
			const sourceData = getSourceDataByFormData(data, isTokenRef.current);

			onSubmit(sourceData);
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
					<FormField
						control={({ field }) => (
							<TextInput {...field} placeholder={t("forms.git-source-data.props.url.placeholder")} />
						)}
						description={t("forms.git-source-data.props.url.description")}
						layout="vertical"
						name="url"
						title={t("forms.git-source-data.props.url.name")}
					/>
					<FormDivider />
					<div className="flex flex-row items-center justify-between gap-3 pb-2 lg:gap-4">
						<FormSectionTitle>{t("authorization")}</FormSectionTitle>
						<FormSectionHeaderButton
							onClick={() => {
								setIsToken(!isToken);
								form.setValue("token", "");
							}}
							size="xs"
							type="button"
							variant="link"
						>
							{isToken
								? t("forms.git-source-data.props.usePassword.name")
								: t("forms.git-source-data.props.useToken.name")}
						</FormSectionHeaderButton>
					</div>
					<FormFieldSet style={{ marginTop: 0 }}>
						{!isToken && (
							<FormField
								control={({ field }) => (
									<TextInput
										{...field}
										placeholder={t("forms.git-source-data.props.gitServerUsername.placeholder")}
									/>
								)}
								description={t("forms.git-source-data.props.gitServerUsername.description")}
								layout="vertical"
								name="username"
								title={t("forms.git-source-data.props.gitServerUsername.name")}
							/>
						)}

						{isToken && (
							<FormField
								control={({ field }) => (
									<SecretInput
										{...field}
										placeholder={t("forms.git-source-data.props.token.placeholder")}
										showClearIcon
									/>
								)}
								description={t("forms.git-source-data.props.token.description")}
								layout="vertical"
								name="token"
								title={t("forms.git-source-data.props.token.name")}
							/>
						)}

						{!isToken && (
							<FormField
								control={({ field }) => (
									<SecretInput
										{...field}
										placeholder={t("forms.git-source-data.props.password.placeholder")}
										showClearIcon
									/>
								)}
								description={t("forms.git-source-data.props.password.description")}
								layout="vertical"
								name="token"
								title={t("forms.git-source-data.props.password.name")}
							/>
						)}

						<FormField
							control={({ field }) => (
								<TextInput
									{...field}
									placeholder={t("forms.git-source-data.props.userName.placeholder")}
								/>
							)}
							description={t("forms.git-source-data.props.userName.description")}
							layout="vertical"
							name="authorName"
							title={t("forms.git-source-data.props.userName.name")}
						/>

						<FormField
							control={({ field }) => (
								<TextInput
									{...field}
									placeholder={t("forms.git-source-data.props.userEmail.placeholder")}
								/>
							)}
							description={t("forms.git-source-data.props.userEmail.description")}
							layout="vertical"
							name="authorEmail"
							title={t("forms.git-source-data.props.userEmail.name")}
						/>
					</FormFieldSet>
				</FormStack>
			</form>
		</Form>
	);
};

export default GitForm;
