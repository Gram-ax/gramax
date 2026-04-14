import resolveFrontendModule from "@app/resolveModule/frontend";
import { useRouter } from "@core/Api/useRouter";
import FetchService from "@core-ui/ApiServices/FetchService";
import ApiUrlCreatorService from "@core-ui/ContextServices/ApiUrlCreator";
import ModalToOpenService from "@core-ui/ContextServices/ModalToOpenService/ModalToOpenService";
import { useBreakpoint } from "@core-ui/hooks/useBreakpoint";
import { cn } from "@core-ui/utils/cn";
import EnterpriseApi from "@ext/enterprise/EnterpriseApi";
import t from "@ext/localization/locale/translate";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button, LoadingButtonTemplate } from "@ui-kit/Button";
import { Dialog, DialogContent } from "@ui-kit/Dialog";
import { Form, FormBody, FormField, FormStack } from "@ui-kit/Form";
import { Input } from "@ui-kit/Input";
import { useCallback, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Logo, TopContainerWrapper } from "../../../../components/HomePage/Welcome/Editor";
import { getGesSignInUrl } from "./utils/getGesSignInUrl";

const formSchema = z.object({
	gesUrl: z.string({ message: t("must-be-not-empty") }),
});

export const SignInEnterpriseTauriForm = () => {
	const breakpoint = useBreakpoint();
	const [open, setOpen] = useState(true);
	// biome-ignore lint/correctness/useExhaustiveDependencies: it's ok
	const onOpenChangeHandler = useCallback(
		(value: boolean) => {
			setOpen(value);
			if (!value) ModalToOpenService.resetValue();
		},
		[setOpen],
	);

	const apiUrlCreator = ApiUrlCreatorService.value;
	const router = useRouter();

	const form = useForm<z.infer<typeof formSchema>>({
		resolver: zodResolver(formSchema),
		mode: "onChange",
		defaultValues: {
			gesUrl: "",
		},
	});

	const abortController = useRef(new AbortController());

	const [isValidChecking, setIsValidChecking] = useState(false);

	const checkIfGesUrlIsValid = useCallback(
		async (gesUrl: string) => {
			setIsValidChecking(true);

			let errorMessage: string;
			if (URL.canParse(gesUrl)) {
				abortController.current.abort();
				abortController.current = new AbortController();

				const checkResult = await new EnterpriseApi(gesUrl).check();
				if (checkResult) errorMessage = "";
				else errorMessage = t("forms.sign-in-ges-tauri.errors.enterpriseServerIsNotAvailable");
			} else errorMessage = t("forms.sign-in-ges-tauri.errors.urlIsNotValid");

			setIsValidChecking(false);

			if (errorMessage) form.setError("gesUrl", { message: errorMessage });
			else form.clearErrors("gesUrl");

			return !errorMessage;
		},
		[form.setError, form.clearErrors],
	);

	const handleSignIn = useCallback(async () => {
		const gesUrl = new URL(form.getValues("gesUrl")).origin;
		if (!gesUrl) return;

		const isGesUrlValid = await checkIfGesUrlIsValid(gesUrl);
		if (!isGesUrlValid) return;

		await FetchService.fetch(apiUrlCreator.setGesUrl(gesUrl));
		const authUrl = getGesSignInUrl(gesUrl, false);
		await resolveFrontendModule("enterpriseLogin")(authUrl, apiUrlCreator, router);
	}, [form.getValues, apiUrlCreator, router, checkIfGesUrlIsValid]);

	const gesUrl = form.watch("gesUrl");
	const isSubmitDisabled = !gesUrl.trim();

	return (
		<Dialog onOpenChange={onOpenChangeHandler} open={open}>
			<DialogContent data-modal-root>
				<Form asChild {...form}>
					<form onSubmit={form.handleSubmit(handleSignIn)}>
						<div className="header flex flex-col justify-center items-center text-center p-6 pb-0 gap-3">
							<Logo isMobile={breakpoint === "sm"} />
							<TopContainerWrapper className={cn(breakpoint === "sm" && "mobile")}>
								<h1 className="text-2xl font-semibold sm:text-lg">{t("welcome.editor.title")}</h1>
							</TopContainerWrapper>
						</div>
						<FormBody>
							<FormStack>
								<FormField
									control={({ field }) => (
										<Input
											placeholder={t("forms.sign-in-ges-tauri.props.gesUrl.placeholder")}
											{...field}
										/>
									)}
									description={t("forms.sign-in-ges-tauri.props.gesUrl.description")}
									labelClassName="w-full"
									layout="vertical"
									name="gesUrl"
									required
									title={t("forms.sign-in-ges-tauri.props.gesUrl.name")}
								/>
								<div className="flex justify-center w-full">
									{isValidChecking ? (
										<LoadingButtonTemplate
											className="w-full"
											text={t("enterprise-guest.buttons.corporateLoginButton")}
											variant="outline"
										/>
									) : (
										<Button
											className="w-full"
											disabled={isSubmitDisabled}
											startIcon="building-2"
											type="submit"
											variant="outline"
										>
											{t("enterprise-guest.buttons.corporateLoginButton")}
										</Button>
									)}
								</div>
							</FormStack>
						</FormBody>
					</form>
				</Form>
			</DialogContent>
		</Dialog>
	);
};
