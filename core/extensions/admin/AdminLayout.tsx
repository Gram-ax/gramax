import PageDataContextService from "@core-ui/ContextServices/PageDataContext";
import t from "@ext/localization/locale/translate";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@ui-kit/Button";
import { Form, FormBody, FormField, FormFooter, FormHeaderBase, FormStack } from "@ui-kit/Form";
import { Input, SecretInput } from "@ui-kit/Input";
import { FormEvent, useCallback, useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useRouter } from "../../logic/Api/useRouter";
import FetchService from "../../ui-logic/ApiServices/FetchService";
import MimeTypes from "../../ui-logic/ApiServices/Types/MimeTypes";
import ApiUrlCreatorService from "../../ui-logic/ContextServices/ApiUrlCreator";

const formSchema = z.object({
	login: z.string({ message: t("must-be-not-empty") }),
	password: z.string({ message: t("must-be-not-empty") }),
});

const AdminLoginLayout = ({ redirectCallback }: { redirectCallback: () => void }) => {
	const apiUrlCreator = ApiUrlCreatorService.value;
	const isLogged = PageDataContextService.value.isLogged;
	const gesUrl = PageDataContextService.value.conf.enterprise.gesUrl;
	const router = useRouter();

	const form = useForm<z.infer<typeof formSchema>>({
		resolver: zodResolver(formSchema),
		mode: "onChange",
	});

	useEffect(() => {
		if (isLogged || gesUrl) redirectCallback();
	}, []);

	const onSubmit = useCallback(
		(e: FormEvent<HTMLFormElement>) => {
			form.handleSubmit(async (data) => {
				const res = await FetchService.fetch(
					apiUrlCreator.getAuthUrl(router, isLogged),
					JSON.stringify(data),
					MimeTypes.json,
					undefined,
					false,
				);

				if (res.ok) redirectCallback();
				else {
					form.setError("password", {
						message: t("forms.admin-login-props.validationErrors.wrongLoginOrPassword"),
					});
				}
			})(e);
		},
		[apiUrlCreator, isLogged, router, redirectCallback],
	);

	if (isLogged || gesUrl) return null;

	return (
		<div className="flex h-screen">
			<div className="m-auto" style={{ width: "min(90%, 30em)" }}>
				<Form {...form}>
					<form className="contents ui-kit" onSubmit={onSubmit}>
						<div className="form-layout">
							<h2>
								<FormHeaderBase className="font-sans text-xl font-medium tracking-tight text-primary-fg">
									{t("forms.admin-login-props.name")}
								</FormHeaderBase>
							</h2>
							<FormBody>
								<FormStack>
									<FormField
										control={({ field }) => (
											<Input
												{...field}
												data-qa="qa-login"
												placeholder={t("forms.admin-login-props.props.login.placeholder")}
											/>
										)}
										layout="vertical"
										name="login"
										required
										title={t("forms.admin-login-props.props.login.name")}
									/>
									<FormField
										control={({ field }) => (
											<SecretInput
												{...field}
												data-qa="qa-password"
												placeholder={t("forms.admin-login-props.props.password.placeholder")}
											/>
										)}
										layout="vertical"
										name="password"
										required
										title={t("forms.admin-login-props.props.password.name")}
									/>
								</FormStack>
							</FormBody>
							<FormFooter
								primaryButton={
									<Button type="submit" variant="primary">
										{t("sing-in")}
									</Button>
								}
							/>
						</div>
					</form>
				</Form>
			</div>
		</div>
	);
};

export default AdminLoginLayout;
