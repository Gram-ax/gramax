import useCheck from "@core-ui/hooks/useCheck";
import { useScrollContainer } from "@ext/enterprise/components/admin/contexts/ScrollContainerContext";
import { useSettings } from "@ext/enterprise/components/admin/contexts/SettingsContext";
import { FloatingAlert } from "@ext/enterprise/components/admin/ui-kit/FloatingAlert";
import { Spinner } from "@ext/enterprise/components/admin/ui-kit/Spinner";
import { StickyHeader } from "@ext/enterprise/components/admin/ui-kit/StickyHeader";
import { StyledField } from "@ext/enterprise/components/admin/ui-kit/StyledField";
import { TabErrorBlock } from "@ext/enterprise/components/admin/ui-kit/TabErrorBlock";
import { TabInitialLoader } from "@ext/enterprise/components/admin/ui-kit/TabInitialLoader";
import { Page } from "@ext/enterprise/types/EnterpriseAdmin";
import { getAdminPageTitle } from "@ext/enterprise/utils/getAdminPageTitle";
import { Button, LoadingButtonTemplate } from "@ui-kit/Button";
import { Icon } from "@ui-kit/Icon";
import { Input } from "@ui-kit/Input";
import { useEffect, useState } from "react";

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
	const { settings, updateMail, ensureMailLoaded, isRefreshing, getTabError } = useSettings();
	const mailSettings = settings?.mailServer;
	const [localSettings, setLocalSettings] = useState<MailSettings>(mailSettings || defaultSettings);
	const [isSaving, setIsSaving] = useState(false);
	const [isScrolled, setIsScrolled] = useState(false);
	const [saveError, setSaveError] = useState<string | null>(null);
	const scrollContainer = useScrollContainer();
	const isEqual = useCheck(mailSettings, localSettings);

	useEffect(() => {
		if (mailSettings) {
			setLocalSettings(mailSettings);
		}
	}, [mailSettings]);

	useEffect(() => {
		if (!scrollContainer) return;

		const handleScroll = () => {
			setIsScrolled(scrollContainer.scrollTop > 0);
		};

		scrollContainer.addEventListener("scroll", handleScroll);
		handleScroll();

		return () => scrollContainer.removeEventListener("scroll", handleScroll);
	}, [scrollContainer]);

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

	const handleSave = async () => {
		setIsSaving(true);
		try {
			await updateMail(localSettings);
		} catch (e: any) {
			setSaveError(e?.message);
		} finally {
			setIsSaving(false);
		}
	};

	useEffect(() => {
		if (!saveError) return;
		const t = setTimeout(() => setSaveError(null), 4000);
		return () => clearTimeout(t);
	}, [saveError]);

	const tabError = getTabError("mail");

	if (!tabError && !mailSettings) {
		return <TabInitialLoader />;
	}

	if (tabError) {
		return <TabErrorBlock message={tabError.message} onRetry={() => ensureMailLoaded(true)} />;
	}

	return (
		<div>
			<StickyHeader
				title={
					<>
						{getAdminPageTitle(Page.MAIL)} <Spinner size="small" show={isRefreshing("mail")} />
					</>
				}
				isScrolled={isScrolled}
				actions={
					<>
						{isSaving ? (
							<LoadingButtonTemplate text="Сохраняем..." />
						) : (
							<Button disabled={isEqual || isSaving} onClick={handleSave}>
								<Icon icon="save" />
								Сохранить
							</Button>
						)}
					</>
				}
			/>
			<FloatingAlert show={Boolean(saveError)} message={saveError} />

			<div className="space-y-6">
				<div>
					<h2 className="text-xl font-medium mb-4">Настройки отправителя</h2>

					<StyledField
						title="Адрес отправителя (From)"
						control={() => (
							<Input
								id="sender"
								placeholder="example@example.com"
								name="sender"
								value={localSettings.sender}
								onChange={handleInputChange}
							/>
						)}
					/>
				</div>

				<div>
					<h2 className="text-xl font-medium mb-4">Настройки SMTP</h2>
					<div className="space-y-4">
						<StyledField
							title="Хост"
							control={() => (
								<Input
									id="smtp.host"
									placeholder="smtp.example.com"
									name="smtp.host"
									value={localSettings.smtp.host}
									onChange={handleInputChange}
								/>
							)}
						/>

						<StyledField
							title="Порт"
							control={() => (
								<Input
									id="smtp.port"
									placeholder="587"
									name="smtp.port"
									type="number"
									value={localSettings.smtp.port}
									onChange={handleInputChange}
								/>
							)}
						/>

						<StyledField
							title="Пользователь"
							control={() => (
								<Input
									id="smtp.user"
									placeholder="example@example.com"
									name="smtp.user"
									value={localSettings.smtp.user}
									onChange={handleInputChange}
								/>
							)}
						/>

						<StyledField
							title="Пароль"
							control={() => (
								<Input
									id="smtp.password"
									placeholder="Введите пароль"
									name="smtp.password"
									type="password"
									value={localSettings.smtp.password}
									onChange={handleInputChange}
								/>
							)}
						/>
					</div>
				</div>
			</div>
		</div>
	);
};

export default MailComponent;
