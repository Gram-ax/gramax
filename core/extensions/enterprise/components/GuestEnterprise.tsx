import Button from "@components/Atoms/Button/Button";
import Input from "@components/Atoms/Input";
import Tooltip from "@components/Atoms/Tooltip";
import t from "@ext/localization/locale/translate";
import GuestField from "@ext/enterprise/components/GuestField";
import useGuestEnterprise from "@ext/enterprise/hooks/useGuestEnterprise";

const OTP_LENGTH = 6;

const GuestEnterprise = () => {
	const {
		formData,
		isLoading,
		isPasswordSent,
		formErrors,
		displayedTooltipText,
		isSendButtonDisabled,
		handleChange,
		handleSendPassword,
	} = useGuestEnterprise();

	return (
		<>
			<legend>{t("enterprise-guest.guestTitle")}</legend>
			<fieldset disabled={isLoading}>
				<GuestField
					description={!isPasswordSent ? t("enterprise-guest.descriptions.emailFieldDescription") : ""}
				>
					<Input
						isCode
						value={formData.email || ""}
						onChange={handleChange}
						placeholder={t("enterprise-guest.placeholders.emailPlaceholder")}
						errorText={formErrors.email}
						type="email"
						name="email"
						autoComplete="email"
					/>
				</GuestField>
				{isPasswordSent && (
					<GuestField description={t("enterprise-guest.descriptions.otpFieldDescription")}>
						<Input
							isCode
							value={formData.password || ""}
							onChange={handleChange}
							placeholder={t("enterprise-guest.placeholders.otpPlaceholder")}
							errorText={formErrors.password}
							maxLength={OTP_LENGTH}
							pattern="[0-9]*"
							inputMode="numeric"
							name="password"
							autoComplete="one-time-code"
						/>
					</GuestField>
				)}
				<div style={{ display: "flex", justifyContent: "flex-end" }}>
					<Tooltip content={displayedTooltipText}>
						<div>
							<Button onClick={handleSendPassword} disabled={isSendButtonDisabled}>
								{isPasswordSent
									? t("enterprise-guest.buttons.resendPasswordButton")
									: t("enterprise-guest.buttons.sendPasswordButton")}
							</Button>
						</div>
					</Tooltip>
				</div>
			</fieldset>
		</>
	);
};

export default GuestEnterprise;
