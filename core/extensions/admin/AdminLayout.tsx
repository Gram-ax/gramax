import PageDataContextService from "@core-ui/ContextServices/PageDataContext";
import t from "@ext/localization/locale/translate";
import { FormEvent, useCallback, useEffect } from "react";
import { useRouter } from "../../logic/Api/useRouter";
import FetchService from "../../ui-logic/ApiServices/FetchService";
import MimeTypes from "../../ui-logic/ApiServices/Types/MimeTypes";
import ApiUrlCreatorService from "../../ui-logic/ContextServices/ApiUrlCreator";
import { Form, FormBody, FormField, FormFooter, FormHeaderBase, FormStack } from "@ui-kit/Form";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Input, SecretInput } from "@ui-kit/Input";
import { Button } from "@ui-kit/Button";

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
					<form onSubmit={onSubmit} className="contents ui-kit">
						<div className="form-layout">
							<h2>
								<FormHeaderBase className="font-sans text-xl font-medium tracking-tight text-primary-fg">
									{t("forms.admin-login-props.name")}
								</FormHeaderBase>
							</h2>
							<FormBody>
								<FormStack>
									<FormField
										name="login"
										layout="vertical"
										required
										title={t("forms.admin-login-props.props.login.name")}
										control={({ field }) => (
											<Input
												{...field}
												data-qa="qa-login"
												placeholder={t("forms.admin-login-props.props.login.placeholder")}
											/>
										)}
									/>
									<FormField
										name="password"
										layout="vertical"
										required
										title={t("forms.admin-login-props.props.password.name")}
										control={({ field }) => (
											<SecretInput
												{...field}
												data-qa="qa-password"
												placeholder={t("forms.admin-login-props.props.password.placeholder")}
											/>
										)}
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
