import { useState, useEffect, useCallback, useMemo } from "react";
import t from "@ext/localization/locale/translate";
import validateEmail from "@core/utils/validateEmail";

const OTP_LENGTH = 6;
const MAIL_SEND_ENDPOINT = "/api/auth/mailSendOTP";
const MAIL_LOGIN_ENDPOINT = "/api/auth/mailLoginOTP";
const DEFAULT_COOLDOWN = 60;
const MINUTE = 60;
const SECOND = 1000;

interface FormData {
	email?: string;
	password?: string;
}

interface FormErrors {
	email?: string;
	password?: string;
}

const useGuestEnterprise = () => {
	const [formData, setFormData] = useState<FormData>({});
	const [isLoading, setIsLoading] = useState(false);
	const [isPasswordSent, setIsPasswordSent] = useState(false);
	const [sendButtonCooldown, setSendButtonCooldown] = useState(0);
	const [apiTooltip, setApiTooltip] = useState<string>(null);
	const [formErrors, setFormErrors] = useState<FormErrors>({});

	const checkEmail = useCallback((email?: string): string => {
		if (!email) return t("enterprise-guest.validationErrors.emailRequired");
		if (!validateEmail(email)) return t("enterprise-guest.validationErrors.emailInvalidFormat");
		return;
	}, []);

	const checkPassword = useCallback(
		(password?: string): string => {
			if (!isPasswordSent) return "";

			if (!password) return t("enterprise-guest.validationErrors.otpRequired");
			if (!/^\d+$/.test(password)) return t("enterprise-guest.validationErrors.otpNumbersOnly");
			if (password.length !== OTP_LENGTH) return t("enterprise-guest.validationErrors.otpLength");
		},
		[isPasswordSent],
	);

	const displayedTooltipText = useMemo(() => {
		if (sendButtonCooldown > 0) {
			if (sendButtonCooldown > MINUTE) {
				const minutes = Math.floor(sendButtonCooldown / MINUTE);
				return t("enterprise-guest.tooltips.tooManyRequests").replace("{minutes}", minutes);
			}
			return t("enterprise-guest.tooltips.resendAvailableIn").replace("{seconds}", sendButtonCooldown);
		}

		return apiTooltip;
	}, [sendButtonCooldown, apiTooltip]);

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

	const handleLogin = useCallback(async (dataToLogin: Required<FormData>) => {
		setIsLoading(true);
		setApiTooltip(null);
		setFormErrors((prev) => ({ ...prev, password: null }));

		try {
			const response = await fetch(MAIL_LOGIN_ENDPOINT, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ email: dataToLogin.email, otp: dataToLogin.password }),
			});

			if (response.ok) {
				const redirectUrl = await response.text();
				window.location.href = redirectUrl;
				return;
			} else if (response.status === 401) {
				setFormErrors((prev) => ({ ...prev, password: t("enterprise-guest.tooltips.invalidOtp") }));
			} else {
				const errorText = t("enterprise-guest.tooltips.loginFailed").replace("{status}", response.status);
				setApiTooltip(errorText);
			}
		} catch (err) {
			setApiTooltip(t("enterprise-guest.tooltips.networkError"));
		} finally {
			setIsLoading(false);
		}
	}, []);

	const handleSendPassword = useCallback(async () => {
		const emailError = checkEmail(formData.email);
		setFormErrors({ email: emailError, password: null });
		setApiTooltip(null);

		if (emailError || !formData.email) return;

		if (sendButtonCooldown > 0) return;

		setIsLoading(true);
		try {
			const response = await fetch(MAIL_SEND_ENDPOINT, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ email: formData.email }),
			});

			if (response.ok) {
				setIsPasswordSent(true);
				setFormData((prev) => ({ ...prev, password: "" }));
				setFormErrors({ email: null, password: null });
				setSendButtonCooldown(DEFAULT_COOLDOWN);
				setApiTooltip(null);
			} else if (response.status === 429) {
				const data = await response.json();
				const timeLeft = parseInt(data?.timeLeft || `${DEFAULT_COOLDOWN}`, 10);
				setSendButtonCooldown(timeLeft);
				setIsPasswordSent(false);
			} else if (response.status >= 500) {
				setIsPasswordSent(false);
				setApiTooltip(t("enterprise-guest.tooltips.internalServerError"));
			} else {
				setIsPasswordSent(false);
				const errorText = t("enterprise-guest.tooltips.errorSendingPassword").replace(
					"{status}",
					response.status,
				);
				setApiTooltip(errorText);
			}
		} catch (err) {
			setIsPasswordSent(false);
			setApiTooltip(t("enterprise-guest.tooltips.networkError"));
		} finally {
			setIsLoading(false);
		}
	}, [formData.email, checkEmail, sendButtonCooldown]);

	const handleChange = useCallback(
		(event: React.ChangeEvent<HTMLInputElement>) => {
			const { name, value } = event.target;
			const isPasswordField = name === "password";

			const processedValue = isPasswordField ? value.replace(/\D/g, "").slice(0, OTP_LENGTH) : value;

			setFormData((prev) => {
				const updatedFormData = { ...prev, [name]: processedValue };

				const emailError = name === "email" ? checkEmail(processedValue) : formErrors.email;
				const passwordError = name === "password" ? checkPassword(processedValue) : formErrors.password;
				setFormErrors({ email: emailError, password: passwordError });

				if (apiTooltip) {
					setApiTooltip(null);
				}

				if (
					isPasswordField &&
					processedValue.length === OTP_LENGTH &&
					!emailError &&
					!checkPassword(processedValue) &&
					updatedFormData.email
				) {
					handleLogin(updatedFormData as Required<FormData>);
				}

				return updatedFormData;
			});
		},
		[checkEmail, checkPassword, formErrors.email, apiTooltip, handleLogin],
	);

	const isSendButtonDisabled = useMemo(() => {
		return isLoading || !!checkEmail(formData.email) || !formData.email || sendButtonCooldown > 0;
	}, [isLoading, formData.email, sendButtonCooldown, checkEmail]);

	return {
		formData,
		isLoading,
		isPasswordSent,
		sendButtonCooldown,
		formErrors,
		displayedTooltipText,
		isSendButtonDisabled,
		handleChange,
		handleSendPassword,
	};
};

export default useGuestEnterprise;
