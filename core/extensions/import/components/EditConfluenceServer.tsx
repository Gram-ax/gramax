import { Form, FormField, FormStack } from "@ui-kit/Form";
import { Input, SecretInput } from "@ui-kit/Input";
import { Button } from "@ui-kit/Button";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useLayoutEffect } from "react";
import t from "@ext/localization/locale/translate";
import { useSetFooterButton } from "@core-ui/hooks/useFooterPortal";
import parseStorageUrl from "@core/utils/parseStorageUrl";
import SourceType from "@ext/storage/logic/SourceDataProvider/model/SourceType";
import ConfluenceServerSourceData from "@ext/confluence/core/server/model/ConfluenceServerSourceData.schema";
import ConfluenceServerAPI from "@ext/confluence/core/api/ConfluenceServerAPI";

interface EditConfluenceServerProps {
	data?: Partial<ConfluenceServerSourceData>;
	onSubmit: (data: ConfluenceServerSourceData) => void;
}

const validateToken = (token: string) => {
	// eslint-disable-next-line no-control-regex
	const hasNonISOChars = /[^\x00-\xFF]/.test(token);
	return !hasNonISOChars;
};

const getFormSchema = () =>
	z.object({
		url: z.string().transform((val) => (val.startsWith("https://") ? val : "https://" + val)),
		token: z.string().refine((val) => validateToken(val), {
			message: t("invalid2") + " " + t("token"),
		}),
	});

const EditConfluenceServer = ({ onSubmit, data }: EditConfluenceServerProps) => {
	const { setPrimaryButton } = useSetFooterButton();

	const form = useForm({
		resolver: zodResolver(getFormSchema()),
		defaultValues: {
			url: data?.domain,
			token: data?.token,
		},
		mode: "onChange",
	});

	const formSubmit = (e) => {
		form.handleSubmit(async (data) => {
			const { origin } = parseStorageUrl(data.url);
			const user = await new ConfluenceServerAPI({
				domain: origin || data.url,
				token: data.token,
				sourceType: SourceType.confluenceServer,
				userName: "",
				userEmail: "",
			}).getUser();

			if (!user) return form.setError("token", { type: "invalid", message: t("invalid2") + " " + t("token") });

			onSubmit({
				sourceType: SourceType.confluenceServer,
				token: data.token,
				domain: origin || data.url,
				userName: user.name,
				userEmail: user.email,
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
						title={t("forms.confluence-server-source-data.props.domain.name")}
						description={t("forms.confluence-server-source-data.props.domain.description")}
						control={({ field }) => (
							<Input
								{...field}
								readOnly={!!data?.domain}
								placeholder={t("forms.confluence-server-source-data.props.domain.placeholder")}
							/>
						)}
					/>
					<FormField
						name="token"
						title={t("forms.confluence-server-source-data.props.token.name")}
						description={
							<>
								{t("forms.confluence-server-source-data.props.token.description")}.
								<a
									href="https://confluence.atlassian.com/enterprise/using-personal-access-tokens-1026032365.html"
									target="_blank"
									rel="noreferrer"
								>
									<Button type="button" variant="link" size="xs">
										{t("more")}
									</Button>
								</a>
							</>
						}
						control={({ field }) => (
							<SecretInput
								{...field}
								showClearIcon
								placeholder={t("forms.confluence-server-source-data.props.token.placeholder")}
							/>
						)}
					/>
				</FormStack>
			</form>
		</Form>
	);
};

export default EditConfluenceServer;
