import Button from "@components/Atoms/Button/Button";
import Checkbox from "@components/Atoms/Checkbox";
import Input from "@components/Atoms/Input";
import styled from "@emotion/styled";
import GitSourceFormData from "@ext/git/actions/Source/Git/GitSourceFormData";
import GitSourceData from "@ext/git/core/model/GitSourceData.schema";
import t from "@ext/localization/locale/translate";
import { ReactNode, useCallback, useEffect, useState } from "react";
import parseStorageUrl from "../../../../../../logic/utils/parseStorageUrl";

export type FormFieldProps = {
	label: string;
	description?: string;
	children: ReactNode;
	checkbox?: boolean;
	checkboxLabel?: string;
	setCheckbox?: (value: boolean) => void;
};

const FormField = ({ label, description, children }: FormFieldProps) => (
	<div className="form-group">
		<div className="field field-string row">
			<label className="control-label">
				<div>
					<div style={{ display: "flex" }}>
						<span>{label}</span>
					</div>
				</div>
			</label>
			<div className="input-lable">{children}</div>
		</div>
		{description && (
			<div className="input-lable-description">
				<div />
				<div className="article">{description}</div>
			</div>
		)}
	</div>
);

const Separator = styled.div`
	margin: 2rem 0;
`;

const CreateGitSourceData = ({
	onSubmit,
	props,
	readOnlyProps,
}: {
	onSubmit?: (editProps: GitSourceData) => void;
	props: GitSourceData;
	readOnlyProps?: { [key: string]: string };
}) => {
	const [thisProps, setThisProps] = useState<GitSourceFormData>(props as GitSourceFormData);
	const [usePassword, setUsePassword] = useState(false);
	const [isUrlValid, setIsUrlValid] = useState(true);
	const [errors, setErrors] = useState<Record<string, string | null>>({});
	const [submitDisabled, setSubmitDisabled] = useState(true);

	const invalidMailText = t("error-mail");
	const invalidDomainText = t("invalid") + " " + t("value");
	const requiredParameterText = t("required-parameter");

	useEffect(() => {
		const validateForm = () => {
			const newErrors: Record<string, string | null> = {};

			const { protocol, domain, pathname } = parseStorageUrl(thisProps.url || "");

			const hasUrl = !!thisProps.url;
			const isDomainOk = !domain || !protocol;
			const isNotHttpOrHttps = protocol !== "http" && protocol !== "https";
			const isDomainStartsWithHttp = !domain || domain.startsWith("http");
			const hasPathname = pathname?.length > 0;

			const isUrlInvalid = (hasUrl && isDomainOk && isNotHttpOrHttps && isDomainStartsWithHttp) || hasPathname;

			newErrors.url = isUrlInvalid ? invalidDomainText : null;

			const isErrorEmail = thisProps.userEmail && !/.*@.*\..+/.test(thisProps.userEmail);
			newErrors.userEmail = isErrorEmail ? invalidMailText : null;

			if (!thisProps.url) newErrors.url = requiredParameterText;

			setErrors(newErrors);

			const hasErrors = Object.values(newErrors).some((error) => error !== null);
			const isAnyFieldEmpty =
				!thisProps.url ||
				!thisProps.gitServerUsername ||
				!thisProps.token ||
				!thisProps.userName ||
				!thisProps.userEmail;

			setSubmitDisabled(hasErrors || isAnyFieldEmpty);
		};

		validateForm();
	}, [thisProps]);

	const handleChange = useCallback(
		(field: string, value: string | boolean) => {
			const newProps = { ...thisProps, [field]: value };

			if (field === "url") {
				const { domain, protocol, origin, pathname } = parseStorageUrl(value as string);

				if (domain && protocol && origin && !domain.startsWith("http") && pathname?.length === 0) {
					newProps.domain = domain;
					newProps.protocol = protocol;
					setIsUrlValid(true);
				} else {
					setIsUrlValid(false);
				}
			}

			if (field === "usePassword") {
				setUsePassword(value as boolean);
				newProps.gitServerUsername = value
					? thisProps.gitServerUsername === "git"
						? ""
						: thisProps.gitServerUsername
					: "git";
			}

			setThisProps(newProps);
		},
		[thisProps, usePassword],
	);

	const handleSubmit = () => {
		if (submitDisabled) return;

		const submitData: GitSourceData = {
			sourceType: thisProps.sourceType,
			domain: thisProps.domain,
			protocol: thisProps.protocol,
			token: thisProps.token,
			userName: thisProps.userName,
			userEmail: thisProps.userEmail,
			gitServerUsername: thisProps.gitServerUsername,
		};

		if (!submitData.gitServerUsername) submitData.gitServerUsername = "git";

		if (onSubmit) onSubmit(submitData);
	};

	const showTokenField = thisProps.domain && isUrlValid;
	const showUserFields = showTokenField && thisProps.token;

	return (
		<div className="form-container" style={{ marginTop: "2rem" }}>
			<FormField
				label={t("forms.git-source-data.props.url.name")}
				description={t("forms.git-source-data.props.url.description")}
			>
				<Input
					isCode
					value={thisProps.url || ""}
					onChange={(e) => handleChange("url", e.target.value)}
					placeholder={t("forms.git-source-data.props.url.placeholder")}
					errorText={errors.url}
					disabled={readOnlyProps?.url !== undefined}
				/>
			</FormField>

			{showTokenField && (
				<div className="form-group">
					<div className="field field-string row" style={{ marginBottom: "0.8rem" }}>
						<label className="control-label">{t("forms.git-source-data.props.usePassword.name")}</label>
						<div className="input-lable" style={{ display: "flex", alignItems: "center" }}>
							<Checkbox
								interactive={true}
								checked={usePassword}
								onChange={(isChecked) => handleChange("usePassword", isChecked)}
							/>
						</div>
					</div>
				</div>
			)}

			{showTokenField && usePassword && (
				<FormField
					label={t("forms.git-source-data.props.gitServerUsername.name")}
					description={t("forms.git-source-data.props.gitServerUsername.description")}
				>
					<Input
						isCode
						value={thisProps.gitServerUsername || ""}
						onChange={(e) => handleChange("gitServerUsername", e.target.value)}
						placeholder={t("forms.git-source-data.props.gitServerUsername.placeholder")}
						disabled={readOnlyProps?.gitServerUsername !== undefined}
					/>
				</FormField>
			)}

			{showTokenField && (
				<FormField
					label={
						usePassword
							? t("forms.git-source-data.props.password.name")
							: t("forms.git-source-data.props.token.name")
					}
					description={
						usePassword
							? t("forms.git-source-data.props.password.description")
							: t("forms.git-source-data.props.token.description")
					}
					checkboxLabel={t("forms.git-source-data.props.usePassword.name")}
					checkbox={usePassword}
					setCheckbox={(value) => handleChange("usePassword", value)}
				>
					<Input
						isCode
						type="password"
						value={thisProps.token || ""}
						onChange={(e) => handleChange("token", e.target.value)}
						placeholder={t("forms.git-source-data.props.token.placeholder")}
						disabled={readOnlyProps?.token !== undefined}
					/>
				</FormField>
			)}

			{showUserFields && (
				<>
					<Separator />
					<FormField
						label={t("forms.git-source-data.props.userName.name")}
						description={t("forms.git-source-data.props.userName.description")}
					>
						<Input
							isCode
							value={thisProps.userName || ""}
							onChange={(e) => handleChange("userName", e.target.value)}
							placeholder={t("forms.git-source-data.props.userName.placeholder")}
							disabled={readOnlyProps?.userName !== undefined}
						/>
					</FormField>

					<FormField
						label={t("forms.git-source-data.props.userEmail.name")}
						description={t("forms.git-source-data.props.userEmail.description")}
					>
						<Input
							isCode
							value={thisProps.userEmail || ""}
							onChange={(e) => handleChange("userEmail", e.target.value)}
							placeholder={t("forms.git-source-data.props.userEmail.placeholder")}
							errorText={errors.userEmail}
							disabled={readOnlyProps?.userEmail !== undefined}
						/>
					</FormField>
				</>
			)}

			{onSubmit && (
				<div className="buttons">
					<Button onClick={handleSubmit} disabled={submitDisabled}>
						{t("add")}
					</Button>
				</div>
			)}
		</div>
	);
};

export default CreateGitSourceData;
