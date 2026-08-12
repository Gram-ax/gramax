import useCheck from "@core-ui/hooks/useCheck";
import { useSettings } from "@ext/enterprise/components/admin/contexts/SettingsContext";
import { useAlertMessage } from "@ext/enterprise/components/admin/hooks/useAlertMessage";
import { useTabGuard } from "@ext/enterprise/components/admin/hooks/useTabGuard";
import { SettingsPageLayout } from "@ext/enterprise/components/admin/ui-kit/SettingsPageLayout";
import { SettingsSection } from "@ext/enterprise/components/admin/ui-kit/SettingsSection";
import { StyledField } from "@ext/enterprise/components/admin/ui-kit/StyledField";
import { toGesErrorCode } from "@ext/enterprise/errors/GesError";
import { getGesErrorBadgeText, getGesErrorTitle, getSaveErrorText } from "@ext/enterprise/errors/getGesErrorText";
import { Page } from "@ext/enterprise/types/Page";
import t from "@ext/localization/locale/translate";
import { Input } from "@ui-kit/Input";
import { useCallback, useEffect, useState } from "react";

export interface MailSettings {
	sender: string;
	smtp: {
		host: string;
		port: number;
		user: string;
		password: string;
	};
}

const defaultSettings: MailSettings = {
	sender: "",
	smtp: {
		host: "",
		port: 587,
		user: "",
		password: "",
	},
};

const MailComponent = () => {
	const { settings, gesUrl, update, ensureLoaded, isRefreshing, getTabError, isInitialLoading } = useSettings();
	const mailSettings = settings?.mail;
	const [localSettings, setLocalSettings] = useState<MailSettings>(mailSettings || defaultSettings);
	const [isSaving, setIsSaving] = useState(false);
	const saveError = useAlertMessage();
	const isEqual = useCheck(mailSettings, localSettings);

	useEffect(() => {
		if (mailSettings) {
			setLocalSettings(mailSettings);
		}
	}, [mailSettings]);

	const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const { name, value } = e.target;
		const keys = name.split(".");

		setLocalSettings((prev) => {
			const newSettings: MailSettings = {
				sender: prev.sender,
				smtp: { ...prev.smtp },
			};

			let current: unknown = newSettings;
			for (let i = 0; i < keys.length - 1; i++) {
				current = current[keys[i]];
			}
			const finalKey = keys[keys.length - 1];
			const finalValue = finalKey === "port" ? parseInt(value, 10) || 0 : value;
			current[finalKey] = finalValue;
			return newSettings;
		});
	};

	const handleSave = useCallback(async () => {
		saveError.hide();
		setIsSaving(true);
		try {
			await update("mail", localSettings);
			await ensureLoaded("mail", true);
		} catch (e) {
			const code = toGesErrorCode(e);
			saveError.alert(getSaveErrorText(code, gesUrl), getGesErrorTitle(code), getGesErrorBadgeText(code));
		} finally {
			setIsSaving(false);
		}
	}, [localSettings, update, ensureLoaded, saveError.hide, saveError.alert, gesUrl]);

	useTabGuard({
		page: Page.MAIL,
		hasChanges: () => {
			if (isInitialLoading("mail") || !mailSettings) {
				return false;
			}
			return !isEqual;
		},
		onSave: handleSave,
		onDiscard: () => {
			if (mailSettings) {
				setLocalSettings(mailSettings);
			}
		},
	});

	const tabError = getTabError("mail");

	return (
		<SettingsPageLayout
			isInitialLoading={!tabError && !mailSettings}
			isRefreshing={isRefreshing("mail")}
			isSaveDisabled={isEqual || isSaving}
			isSaving={isSaving}
			onRetry={() => ensureLoaded("mail", true)}
			onSave={handleSave}
			page={Page.MAIL}
			saveError={saveError}
			tabError={tabError}
		>
			<SettingsSection title={t("enterprise.admin.mail.sender-settings")}>
				<StyledField
					control={() => (
						<Input
							id="sender"
							name="sender"
							onChange={handleInputChange}
							placeholder="example@example.com"
							value={localSettings.sender}
						/>
					)}
					title={t("enterprise.admin.mail.sender-address")}
				/>
			</SettingsSection>

			<SettingsSection contentClassName="space-y-4" title={t("enterprise.admin.mail.smtp-settings")}>
				<StyledField
					control={() => (
						<Input
							id="smtp.host"
							name="smtp.host"
							onChange={handleInputChange}
							placeholder="smtp.example.com"
							value={localSettings.smtp.host}
						/>
					)}
					title={t("enterprise.admin.mail.host")}
				/>

				<StyledField
					control={() => (
						<Input
							id="smtp.port"
							name="smtp.port"
							onChange={handleInputChange}
							placeholder="587"
							type="number"
							value={localSettings.smtp.port}
						/>
					)}
					title={t("enterprise.admin.mail.port")}
				/>

				<StyledField
					control={() => (
						<Input
							id="smtp.user"
							name="smtp.user"
							onChange={handleInputChange}
							placeholder="example@example.com"
							value={localSettings.smtp.user}
						/>
					)}
					title={t("user")}
				/>

				<StyledField
					control={() => (
						<Input
							id="smtp.password"
							name="smtp.password"
							onChange={handleInputChange}
							placeholder={t("enterprise.admin.mail.password-placeholder")}
							type="password"
							value={localSettings.smtp.password}
						/>
					)}
					title={t("enterprise.admin.mail.password")}
				/>
			</SettingsSection>
		</SettingsPageLayout>
	);
};

export default MailComponent;
