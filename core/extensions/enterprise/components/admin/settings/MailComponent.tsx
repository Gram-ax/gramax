import useCheck from "@core-ui/hooks/useCheck";
import { useSettings } from "@ext/enterprise/components/admin/contexts/SettingsContext";
import { useScrollShadow } from "@ext/enterprise/components/admin/hooks/useScrollShadow";
import { useTabGuard } from "@ext/enterprise/components/admin/hooks/useTabGuard";
import { FloatingAlert } from "@ext/enterprise/components/admin/ui-kit/FloatingAlert";
import { Spinner } from "@ext/enterprise/components/admin/ui-kit/Spinner";
import { StickyHeader } from "@ext/enterprise/components/admin/ui-kit/StickyHeader";
import { StyledField } from "@ext/enterprise/components/admin/ui-kit/StyledField";
import { TabErrorBlock } from "@ext/enterprise/components/admin/ui-kit/TabErrorBlock";
import { TabInitialLoader } from "@ext/enterprise/components/admin/ui-kit/TabInitialLoader";
import { Page } from "@ext/enterprise/types/EnterpriseAdmin";
import { getAdminPageTitle } from "@ext/enterprise/utils/getAdminPageTitle";
import t from "@ext/localization/locale/translate";
import { Button, LoadingButtonTemplate } from "@ui-kit/Button";
import { Icon } from "@ui-kit/Icon";
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
	const { settings, updateMail, ensureMailLoaded, isRefreshing, getTabError, isInitialLoading } = useSettings();
	const mailSettings = settings?.mailServer;
	const [localSettings, setLocalSettings] = useState<MailSettings>(mailSettings || defaultSettings);
	const [isSaving, setIsSaving] = useState(false);
	const { isScrolled } = useScrollShadow();
	const [saveError, setSaveError] = useState<string | null>(null);
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

			let current: any = newSettings;
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
		setIsSaving(true);
		try {
			await updateMail(localSettings);
		} catch (e: any) {
			setSaveError(e?.message);
		} finally {
			setIsSaving(false);
		}
	}, [localSettings, updateMail]);

	useEffect(() => {
		if (!saveError) return;
		const t = setTimeout(() => setSaveError(null), 4000);
		return () => clearTimeout(t);
	}, [saveError]);

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

	if (!tabError && !mailSettings) {
		return <TabInitialLoader />;
	}

	if (tabError) {
		return <TabErrorBlock message={tabError.message} onRetry={() => ensureMailLoaded(true)} />;
	}

	return (
		<>
			<StickyHeader
				actions={
					<>
						{isSaving ? (
							<LoadingButtonTemplate text={`${t("save2")}...`} />
						) : (
							<Button disabled={isEqual || isSaving} onClick={handleSave}>
								<Icon icon="save" />
								{t("save")}
							</Button>
						)}
					</>
				}
				isScrolled={isScrolled}
				title={
					<>
						{getAdminPageTitle(Page.MAIL)} <Spinner show={isRefreshing("mail")} size="small" />
					</>
				}
			/>
			<FloatingAlert message={saveError} show={Boolean(saveError)} />

			<div className="px-6 space-y-6">
				<div>
					<h2 className="text-xl font-medium mb-4">{t("enterprise.admin.mail.sender-settings")}</h2>

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
				</div>

				<div>
					<h2 className="text-xl font-medium mb-4">{t("enterprise.admin.mail.smtp-settings")}</h2>
					<div className="space-y-4">
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
							title={t("enterprise.admin.mail.user")}
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
					</div>
				</div>
			</div>
		</>
	);
};

export default MailComponent;
