import { FormProps } from "@ext/catalog/actions/propsEditor/logic/createFormSchema";
import t from "@ext/localization/locale/translate";
import { Button } from "@ui-kit/Button";
import { ContentDivider } from "@ui-kit/Divider";
import { Form, FormField, FormStack } from "@ui-kit/Form";
import GesFormHeader, { GesFormHeaderProps } from "@ui-kit/Form/GesFormHeader";
import { Input } from "@ui-kit/Input";
import { InputOTP, InputOTPGroup, InputOTPSeparator, InputOTPSlot } from "@ui-kit/InputOTP";
import { useMemo } from "react";
import { UseFormReturn } from "react-hook-form";
import { z } from "zod";

interface SignInEnterpriseFormProps {
	authUrl: string;
	form: UseFormReturn<any>;
	isLoading: boolean;
	isPasswordSent: boolean;
	sendButtonCooldown: number;
	isResendButtonDisabled: boolean;
	formSubmit: (data: z.infer<any>) => Promise<void>;
	handleOtpChange: (value: string) => void;
	handleSendPassword: () => Promise<void>;
	relocateToAuthUrl: () => void;
	onlySSO: boolean;
}

const SignInEnterpriseForm = (props: SignInEnterpriseFormProps) => {
	const {
		form,
		isLoading,
		isPasswordSent,
		sendButtonCooldown,
		isResendButtonDisabled,
		formSubmit,
		handleOtpChange,
		handleSendPassword,
		relocateToAuthUrl,
		onlySSO,
	} = props;

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
		<Form asChild {...form}>
			<form className="contents" onSubmit={form.handleSubmit(formSubmit)}>
				<div className="flex flex-col gap-4">
					<GesFormHeader {...formHeaderProps} />
					{!onlySSO && (
						<>
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
										{...formProps}
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

							<div style={{ marginTop: "-0.5rem" }}>
								<ContentDivider>
									<div className="text-sm text-center font-normal text-muted whitespace-nowrap">
										{t("enterprise-guest.descriptions.continueWith")}
									</div>
								</ContentDivider>
							</div>
						</>
					)}

					<Button
						type="button"
						variant="outline"
						startIcon="building-2"
						style={{ width: "100%", marginTop: "-0.5rem" }}
						onClick={relocateToAuthUrl}
					>
						{t("enterprise-guest.buttons.corporateLoginButton")}
					</Button>
				</div>
			</form>
		</Form>
	);
};

export default SignInEnterpriseForm;
