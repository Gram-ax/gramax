import t from "@ext/localization/locale/translate";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import validateEmail from "@core/utils/validateEmail";

import { useState, useCallback, useMemo, useEffect } from "react";

const OTP_LENGTH = 6;
const MAIL_SEND_ENDPOINT = "/api/auth/mailSendOTP";
const MAIL_LOGIN_ENDPOINT = "/api/auth/mailLoginOTP";
const SENT_OTP_REQUEST_DELAY = 60;
const MINUTE = 60;
const SECOND = 1000;

export const useSignInEnterprise = () => {
	const [isLoading, setIsLoading] = useState(false);
	const [isPasswordSent, setIsPasswordSent] = useState(false);
	const [sendButtonCooldown, setSendButtonCooldown] = useState(0);

	const formSchema = z.object({
		email: z
			.string()
			.min(1, { message: t("enterprise-guest.validationErrors.emailRequired") })
			.refine((email) => validateEmail(email), {
				message: t("enterprise-guest.validationErrors.emailInvalidFormat"),
			}),
		otp: z
			.string()
			.optional()
			.refine(
				(otp) => {
					if (!isPasswordSent) return true;
					if (!otp) return false;
					if (!/^\d+$/.test(otp)) return false;
					return otp.length === OTP_LENGTH;
				},
				{
					message: isPasswordSent ? t("enterprise-guest.validationErrors.otpRequired") : "",
				},
			),
	});

	const form = useForm<z.infer<typeof formSchema>>({
		resolver: zodResolver(formSchema),
		defaultValues: {
			email: "",
			otp: "",
		},
		mode: "onChange",
	});

	useEffect(() => {
		let timer: NodeJS.Timeout = null;
		if (sendButtonCooldown > 0) {
			timer = setInterval(() => {
				setSendButtonCooldown((prev) => (prev > 0 ? prev - 1 : 0));
			}, SECOND);
		}
		return () => {
			if (timer) clearInterval(timer);
		};
	}, [sendButtonCooldown]);

	const handleLogin = useCallback(
		async (email: string, otp: string) => {
			setIsLoading(true);
			form.clearErrors("otp");

			try {
				const response = await fetch(MAIL_LOGIN_ENDPOINT, {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({ email, otp }),
				});

				if (response.ok) {
					const redirectUrl = await response.text();
					window.location.href = redirectUrl;
					return;
				} else if (response.status === 401) {
					form.setError("otp", { message: t("enterprise-guest.tooltips.invalidOtp") });
				} else {
					const errorText = t("enterprise-guest.tooltips.loginFailed").replace("{status}", response.status);
					form.setError("otp", { message: errorText });
				}
			} catch (err) {
				form.setError("otp", { message: t("enterprise-guest.tooltips.networkError") });
			} finally {
				setIsLoading(false);
			}
		},
		[form],
	);

	const getTryAgainText = (delay) => {
		if (delay > MINUTE) {
			const minutes = Math.floor(delay / MINUTE);
			return t("enterprise-guest.tooltips.tooManyRequests").replace("{minutes}", minutes);
		}

		return t("enterprise-guest.tooltips.resendAvailableIn").replace("{seconds}", delay);
	};

	const handleSendPassword = useCallback(async () => {
		const email = form.getValues("email");
		const emailValidation = await form.trigger("email");

		if (!emailValidation || !email) {
			if (!email) {
				form.setError("email", { message: t("enterprise-guest.validationErrors.emailRequired") });
			}
			return;
		}

		setIsLoading(true);
		form.clearErrors("email");

		try {
			const response = await fetch(MAIL_SEND_ENDPOINT, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ email }),
			});

			if (response.ok) {
				setIsPasswordSent(true);
				form.setValue("otp", "");
				form.clearErrors();
				setSendButtonCooldown(SENT_OTP_REQUEST_DELAY);
			} else if (response.status === 429) {
				const data = await response.json();
				const timeLeft = parseInt(data?.timeLeft || `${SENT_OTP_REQUEST_DELAY}`, 10);
				const error = getTryAgainText(timeLeft);
				setSendButtonCooldown(timeLeft);
				setIsPasswordSent(false);
				form.setError("email", { message: error });
			} else if (response.status >= 500) {
				setIsPasswordSent(false);
				form.setError("email", { message: t("enterprise-guest.tooltips.internalServerError") });
			} else {
				setIsPasswordSent(false);
				const errorText = t("enterprise-guest.tooltips.errorSendingPassword").replace(
					"{status}",
					response.status,
				);
				form.setError("email", { message: errorText });
			}
		} catch (err) {
			setIsPasswordSent(false);
			form.setError("email", { message: t("enterprise-guest.tooltips.networkError") });
		} finally {
			setIsLoading(false);
		}
	}, [form, sendButtonCooldown]);

	const formSubmit = async (data: z.infer<typeof formSchema>) => {
		if (!isPasswordSent) {
			await handleSendPassword();
		} else if (data.otp && data.otp.length === OTP_LENGTH) {
			await handleLogin(data.email, data.otp);
		} else {
			form.setError("otp", { message: t("enterprise-guest.validationErrors.otpRequired") });
		}
	};

	const handleOtpChange = useCallback(
		(value: string) => {
			form.setValue("otp", value);
			if (value.length === OTP_LENGTH) {
				const email = form.getValues("email");
				if (email && !form.formState.errors.email) {
					handleLogin(email, value);
				}
			}
		},
		[form, handleLogin],
	);

	const isResendButtonDisabled = useMemo(() => {
		return isLoading || sendButtonCooldown > 0;
	}, [isLoading, sendButtonCooldown]);

	const resetForm = useCallback(() => {
		setIsPasswordSent(false);
		setSendButtonCooldown(0);
		form.reset();
	}, [form]);

	return {
		form,
		isLoading,
		isPasswordSent,
		sendButtonCooldown,
		formSubmit,
		handleOtpChange,
		isResendButtonDisabled,
		handleSendPassword,
		resetForm,
	};
};
