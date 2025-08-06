import WorkspaceService from "@core-ui/ContextServices/Workspace";
import { FormProps } from "@ext/catalog/actions/propsEditor/logic/createFormSchema";
import { useSignInEnterprise } from "@ext/enterprise/components/useSignInEnterprise";
import { AuthMethod } from "@ext/enterprise/types/UserSettings";
import t from "@ext/localization/locale/translate";
import { Button, IconButton } from "@ui-kit/Button";
import { DescriptionDivider } from "@ui-kit/Divider";
import { Form, FormField, FormFooterBase, FormStack } from "@ui-kit/Form";
import GesFormHeader, { GesFormHeaderProps } from "@ui-kit/Form/GesFormHeader";
import { Input } from "@ui-kit/Input";
import { InputOTP, InputOTPGroup, InputOTPSeparator, InputOTPSlot } from "@ui-kit/InputOTP";
import { Modal, ModalBody, ModalContent, ModalTrigger } from "@ui-kit/Modal";
import { useCallback, useMemo, useState } from "react";

const SignInEnterpriseForm = ({ authUrl }: { authUrl: string }) => {
	const [isOpen, setIsOpen] = useState(false);

	const workspace = WorkspaceService.current();
	const onlySSO = !workspace.enterprise.authMethods?.includes(AuthMethod.GUEST_MAIL);

	const {
		form,
		isLoading,
		isPasswordSent,
		sendButtonCooldown,
		formSubmit,
		handleOtpChange,
		isResendButtonDisabled,
		handleSendPassword,
		resetForm,
	} = useSignInEnterprise();

	const relocateToAuthUrl = () => {
		window.location.href = authUrl;
	};

	const onOpenChange = useCallback(
		(value: boolean) => {
			if (!value) {
				resetForm();
			}
			setIsOpen(value);
		},
		[resetForm],
	);

	const formProps: FormProps = useMemo(() => {
		return {
			labelClassName: "w-24",
		};
	}, []);

	const formHeaderProps = useMemo<GesFormHeaderProps<{ fillColor: string }>>(() => {
		return {
			icon: "gramax-ges",
			title: t("enterprise-guest.welcomeTitle"),
			iconProps: { fillColor: "hsl(var(--primary-accent))" },
		};
	}, []);

	return (
		<Modal open={isOpen} onOpenChange={onOpenChange}>
			<ModalTrigger asChild>
				<IconButton
					variant="ghost"
					icon="log-in"
					onClick={(e) => {
						if (onlySSO) {
							e.stopPropagation();
							e.preventDefault();
							relocateToAuthUrl();
						}
					}}
				/>
			</ModalTrigger>
			<ModalContent data-modal-root data-sign-in-enteprise-form>
				<Form asChild {...form}>
					<form className="contents" onSubmit={form.handleSubmit(formSubmit)}>
						<GesFormHeader {...formHeaderProps} />
						<ModalBody>
							<FormStack>
								<FormField
									name="email"
									title={t("enterprise-guest.fields.emailLabel")}
									description={t("enterprise-guest.descriptions.emailFieldDescription")}
									control={({ field }) => {
										return (
											<Input
												data-qa="email"
												placeholder={t("enterprise-guest.placeholders.emailPlaceholder")}
												type="email"
												autoComplete="email"
												disabled={isLoading}
												{...field}
											/>
										);
									}}
									{...formProps}
								/>

								{isPasswordSent && (
									<FormField
										name="otp"
										title={t("enterprise-guest.fields.otpLabel")}
										description={t("enterprise-guest.descriptions.otpFieldDescription")}
										control={({ field }) => (
											<InputOTP
												autoFocus
												maxLength={6}
												value={field.value || ""}
												onChange={handleOtpChange}
												onBlur={field.onBlur}
												pasteTransformer={(pasted) => pasted.replace(/\D/g, "")}
												disabled={isLoading}
											>
												<InputOTPGroup>
													<InputOTPSlot index={0} />
													<InputOTPSlot index={1} />
													<InputOTPSlot index={2} />
												</InputOTPGroup>
												<InputOTPSeparator />
												<InputOTPGroup>
													<InputOTPSlot index={3} />
													<InputOTPSlot index={4} />
													<InputOTPSlot index={5} />
												</InputOTPGroup>
											</InputOTP>
										)}
										{...formProps}
									/>
								)}

								<div style={{ paddingTop: "1rem" }}>
									<Button type="submit" style={{ width: "100%" }} disabled={isLoading}>
										{isPasswordSent
											? t("enterprise-guest.buttons.confirmButton")
											: t("enterprise-guest.buttons.sendPasswordButton")}
									</Button>
								</div>

								{isPasswordSent && (
									<Button
										type="button"
										variant="link"
										onClick={handleSendPassword}
										style={{ width: "100%", marginTop: "0.75rem" }}
										disabled={isResendButtonDisabled}
									>
										{sendButtonCooldown !== 0
											? t("enterprise-guest.buttons.resendPasswordButtonWithCooldown").replace(
													"{seconds}",
													String(sendButtonCooldown),
											  )
											: t("enterprise-guest.buttons.resendPasswordButton")}
									</Button>
								)}
							</FormStack>
						</ModalBody>

						<FormFooterBase>
							<FormStack style={{ marginTop: "-1rem" }}>
								<DescriptionDivider description={t("enterprise-guest.descriptions.continueWith")} />

								<Button
									type="button"
									variant="outline"
									startIcon="building-2"
									style={{ width: "100%" }}
									onClick={relocateToAuthUrl}
								>
									{t("enterprise-guest.buttons.corporateLoginButton")}
								</Button>
							</FormStack>
						</FormFooterBase>
					</form>
				</Form>
			</ModalContent>
		</Modal>
	);
};

export default SignInEnterpriseForm;
