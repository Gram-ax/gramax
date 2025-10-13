import { useSetFooterButton } from "@core-ui/hooks/useFooterPortal";
import parseStorageUrl from "@core/utils/parseStorageUrl";
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
import { useLayoutEffect, useState } from "react";
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
		username: z.string({ message: t("must-be-not-empty") }),
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
			const sourceData = getSourceDataByFormData(data, isToken);

			onSubmit(sourceData);
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
						title={t("forms.git-source-data.props.url.name")}
						layout="vertical"
						description={t("forms.git-source-data.props.url.description")}
						control={({ field }) => (
							<TextInput {...field} placeholder={t("forms.git-source-data.props.url.placeholder")} />
						)}
					/>
					<FormDivider />
					<div className="flex flex-row items-center justify-between gap-3 pb-2 lg:gap-4">
						<FormSectionTitle>{t("authorization")}</FormSectionTitle>
						<FormSectionHeaderButton
							size="xs"
							variant="link"
							type="button"
							onClick={() => {
								setIsToken(!isToken);
								form.setValue("token", "");
							}}
						>
							{isToken
								? t("forms.git-source-data.props.usePassword.name")
								: t("forms.git-source-data.props.useToken.name")}
						</FormSectionHeaderButton>
					</div>
					<FormFieldSet style={{ marginTop: 0 }}>
						<FormField
							title={t("forms.git-source-data.props.gitServerUsername.name")}
							name="username"
							layout="vertical"
							description={t("forms.git-source-data.props.gitServerUsername.description")}
							control={({ field }) => (
								<TextInput
									{...field}
									placeholder={t("forms.git-source-data.props.gitServerUsername.placeholder")}
								/>
							)}
						/>

						{isToken && (
							<FormField
								title={t("forms.git-source-data.props.token.name")}
								name="token"
								layout="vertical"
								description={t("forms.git-source-data.props.token.description")}
								control={({ field }) => (
									<SecretInput
										{...field}
										showClearIcon
										placeholder={t("forms.git-source-data.props.token.placeholder")}
									/>
								)}
							/>
						)}

						{!isToken && (
							<FormField
								title={t("forms.git-source-data.props.password.name")}
								name="token"
								layout="vertical"
								description={t("forms.git-source-data.props.password.description")}
								control={({ field }) => (
									<SecretInput
										{...field}
										showClearIcon
										placeholder={t("forms.git-source-data.props.password.placeholder")}
									/>
								)}
							/>
						)}

						<FormField
							title={t("forms.git-source-data.props.userName.name")}
							name="authorName"
							layout="vertical"
							description={t("forms.git-source-data.props.userName.description")}
							control={({ field }) => (
								<TextInput
									{...field}
									placeholder={t("forms.git-source-data.props.userName.placeholder")}
								/>
							)}
						/>

						<FormField
							title={t("forms.git-source-data.props.userEmail.name")}
							name="authorEmail"
							layout="vertical"
							description={t("forms.git-source-data.props.userEmail.description")}
							control={({ field }) => (
								<TextInput
									{...field}
									placeholder={t("forms.git-source-data.props.userEmail.placeholder")}
								/>
							)}
						/>
					</FormFieldSet>
				</FormStack>
			</form>
		</Form>
	);
};

export default GitForm;
