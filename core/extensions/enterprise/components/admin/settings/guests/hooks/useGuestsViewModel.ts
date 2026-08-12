import useCheck from "@core-ui/hooks/useCheck";
import { useSettings } from "@ext/enterprise/components/admin/contexts/SettingsContext";
import { useAlertMessage } from "@ext/enterprise/components/admin/hooks/useAlertMessage";
import { useTabGuard } from "@ext/enterprise/components/admin/hooks/useTabGuard";
import { useRowSelectionWithData } from "@ext/enterprise/components/admin/ui-kit/table/useRowSelection";
import { toGesErrorCode } from "@ext/enterprise/errors/GesError";
import { getGesErrorBadgeText, getGesErrorTitle, getSaveErrorText } from "@ext/enterprise/errors/getGesErrorText";
import { Page } from "@ext/enterprise/types/Page";
import t from "@ext/localization/locale/translate";
import type { ColumnDef } from "@ui-kit/DataTable";
import { useCallback, useEffect, useMemo, useState } from "react";
import type { Domain, GuestsSettings } from "../types/GuestsComponent";

const getDomainRowId = (d: Domain) => d.id;

const domainsColumns: ColumnDef<Domain>[] = [
	{
		accessorKey: "domain",
		header: t("enterprise.admin.guests.domains.title"),
	},
];

const defaultSettings: GuestsSettings = {
	sessionDurationHours: 12,
	whitelistEnabled: false,
	domains: [],
};

export const useGuestsViewModel = () => {
	const {
		settings,
		gesUrl,
		update,
		isInitialLoading: isInitialLoadingTab,
		ensureLoaded,
		isRefreshing: isRefreshingTab,
		getTabError,
	} = useSettings();
	const guestsSettings = settings?.guests;
	const otpEnabled = settings?.workspace?.modules?.guests ?? false;
	const [localSettings, setLocalSettings] = useState<GuestsSettings>(guestsSettings || defaultSettings);
	const [localOtpEnabled, setOtpEnabled] = useState(otpEnabled);
	const [isSaving, setIsSaving] = useState(false);
	const isEqual = useCheck(guestsSettings, localSettings) && otpEnabled === localOtpEnabled;
	const saveError = useAlertMessage();

	const isInitialLoading = isInitialLoadingTab("guests");
	const isRefreshing = isRefreshingTab("guests");
	const tabError = getTabError("guests");

	const retry = useCallback(() => {
		ensureLoaded("guests", true);
	}, [ensureLoaded]);

	useEffect(() => {
		if (guestsSettings) {
			setLocalSettings(guestsSettings);
		}
	}, [guestsSettings]);

	useEffect(() => {
		setOtpEnabled(otpEnabled);
	}, [otpEnabled]);

	const onOtpChange = useCallback((enabled: boolean) => {
		setOtpEnabled(enabled);
		if (enabled) {
			setLocalSettings((prev) => ({
				...prev,
				whitelistEnabled: true,
			}));
		}
	}, []);

	const handleSave = useCallback(async () => {
		saveError.hide();
		setIsSaving(true);
		try {
			const otpEnabledChanged = otpEnabled !== localOtpEnabled;

			if (otpEnabledChanged && settings?.workspace) {
				const workspace = { ...settings.workspace };
				workspace.modules = { ...workspace.modules, guests: localOtpEnabled };

				await update("workspace", workspace);
			}

			await update("guests", localSettings);
		} catch (e) {
			const code = toGesErrorCode(e);
			saveError.alert(getSaveErrorText(code, gesUrl), getGesErrorTitle(code), getGesErrorBadgeText(code));
		} finally {
			setIsSaving(false);
		}
	}, [
		localSettings,
		localOtpEnabled,
		otpEnabled,
		settings?.workspace,
		update,
		saveError.hide,
		saveError.alert,
		gesUrl,
	]);

	useTabGuard({
		page: Page.GUESTS,
		hasChanges: () => {
			if (isInitialLoadingTab("guests") || !guestsSettings) {
				return false;
			}
			return !isEqual;
		},
		onSave: handleSave,
		onDiscard: () => {
			if (guestsSettings) {
				setLocalSettings(guestsSettings);
			}
			setOtpEnabled(otpEnabled);
		},
	});

	const domainsData = useMemo(() => {
		return (
			localSettings.domains?.map((domain) => ({
				id: domain,
				domain: domain,
			})) || []
		);
	}, [localSettings.domains]);

	const {
		rowSelection: domainSelection,
		setRowSelection: setDomainSelection,
		selectedRows: selectedDomains,
	} = useRowSelectionWithData(domainsData, getDomainRowId);

	const removeSelectedDomains = useCallback(() => {
		const domainsToDelete = selectedDomains.map((row) => row.domain);
		setLocalSettings((prev) => ({
			...prev,
			domains: prev.domains?.filter((domain) => !domainsToDelete.includes(domain)) || [],
		}));
	}, [selectedDomains]);

	const handleSessionChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const { name, value } = e.target;
		setLocalSettings((prev) => ({
			...prev,
			[name]: name === "sessionDurationHours" ? parseInt(value, 10) || 0 : value,
		}));
	};

	const handleAddDomain = useCallback(
		(domain: string) => {
			if (!localSettings) return;

			if (domain && !localSettings.domains.includes(domain)) {
				setLocalSettings((prev) => {
					return {
						...prev,
						domains: [...prev.domains, domain],
					};
				});
			}
		},
		[localSettings],
	);

	return {
		domain: {
			rows: domainsData,
			getId: getDomainRowId,
			columns: domainsColumns,
			selection: domainSelection,
			setSelection: setDomainSelection,
			selected: selectedDomains,
			removeSelected: removeSelectedDomains,
			add: handleAddDomain,
			searchColumnId: "domain",
		},
		setting: {
			otpEnabled: localOtpEnabled,
			onOtpChange,
			setLocalOtpEnabled: setOtpEnabled,
			localSettings,
			setLocalSettings,
			handleSessionChange,
		},
		form: {
			tabError,
			isInitialLoading,
			isRefreshing,
			isSaveDisabled: isEqual || isSaving,
			isSaving,
			saveError,
			onSave: handleSave,
			retry,
		},
	};
};
