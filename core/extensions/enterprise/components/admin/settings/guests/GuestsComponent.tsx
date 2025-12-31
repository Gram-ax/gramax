import useCheck from "@core-ui/hooks/useCheck";
import { useSettings } from "@ext/enterprise/components/admin/contexts/SettingsContext";
import { useScrollShadow } from "@ext/enterprise/components/admin/hooks/useScrollShadow";
import { useTabGuard } from "@ext/enterprise/components/admin/hooks/useTabGuard";
import { AlertDeleteDialog } from "@ext/enterprise/components/admin/ui-kit/AlertDeleteDialog";
import { FloatingAlert } from "@ext/enterprise/components/admin/ui-kit/FloatingAlert";
import { Spinner } from "@ext/enterprise/components/admin/ui-kit/Spinner";
import { StickyHeader } from "@ext/enterprise/components/admin/ui-kit/StickyHeader";
import { TabErrorBlock } from "@ext/enterprise/components/admin/ui-kit/TabErrorBlock";
import { TabInitialLoader } from "@ext/enterprise/components/admin/ui-kit/TabInitialLoader";
import { TableComponent } from "@ext/enterprise/components/admin/ui-kit/table/TableComponent";
import { TableInfoBlock } from "@ext/enterprise/components/admin/ui-kit/table/TableInfoBlock";
import { TableToolbar } from "@ext/enterprise/components/admin/ui-kit/table/TableToolbar";
import { TableToolbarTextInput } from "@ext/enterprise/components/admin/ui-kit/table/TableToolbarTextInput";
import { Page } from "@ext/enterprise/types/EnterpriseAdmin";
import { getAdminPageTitle } from "@ext/enterprise/utils/getAdminPageTitle";
import t from "@ext/localization/locale/translate";
import { Button, LoadingButtonTemplate } from "@ui-kit/Button";
import { getCoreRowModel, getFilteredRowModel, useReactTable } from "@ui-kit/DataTable";
import { Description } from "@ui-kit/Description";
import { Field } from "@ui-kit/Field";
import { Icon } from "@ui-kit/Icon";
import { Input } from "@ui-kit/Input";
import { Switch } from "ics-ui-kit/components/switch";
import { useCallback, useEffect, useMemo, useState } from "react";
import { GuestsToolbarAddBtn } from "./components/GuestsToolbarAddBtn";
import { guestsTableColumns } from "./config/GuestsTableConfig";
import { Domain, GuestsSettings } from "./types/GuestsComponent";

const defaultSettings: GuestsSettings = {
	sessionDurationHours: 12,
	whitelistEnabled: false,
	domains: [],
};

const GuestsComponent = () => {
	const { settings, updateGuests, updateWorkspace, ensureGuestsLoaded, getTabError, isInitialLoading, isRefreshing } =
		useSettings();
	const guestsSettings = settings?.guests;
	const otpEnabled = settings?.workspace?.modules?.guests ?? false;
	const [localSettings, setLocalSettings] = useState<GuestsSettings>(guestsSettings || defaultSettings);
	const [localOtpEnabled, setLocalOtpEnabled] = useState(otpEnabled);
	const [isSaving, setIsSaving] = useState(false);
	const { isScrolled } = useScrollShadow();
	const [rowSelection, setRowSelection] = useState({});
	const isEqual = useCheck(guestsSettings, localSettings) && otpEnabled === localOtpEnabled;
	const [saveError, setSaveError] = useState<string | null>(null);

	useEffect(() => {
		if (guestsSettings) {
			setLocalSettings(guestsSettings);
		}
	}, [guestsSettings]);

	useEffect(() => {
		setLocalOtpEnabled(otpEnabled);
	}, [otpEnabled]);

	useEffect(() => {
		if (!saveError) return;
		const t = setTimeout(() => setSaveError(null), 4000);
		return () => clearTimeout(t);
	}, [saveError]);

	const handleSave = useCallback(async () => {
		setIsSaving(true);
		try {
			const otpEnabledChanged = otpEnabled !== localOtpEnabled;

			if (otpEnabledChanged && settings?.workspace) {
				const workspace = { ...settings.workspace };
				workspace.modules = { ...workspace.modules, guests: localOtpEnabled };

				await updateWorkspace(workspace);
			}

			await updateGuests(localSettings);
		} catch (e: any) {
			setSaveError(e?.message);
		} finally {
			setIsSaving(false);
		}
	}, [localSettings, localOtpEnabled, otpEnabled, settings?.workspace, updateWorkspace, updateGuests]);

	useTabGuard({
		page: Page.GUESTS,
		hasChanges: () => {
			if (isInitialLoading("guests") || !guestsSettings) {
				return false;
			}
			return !isEqual;
		},
		onSave: handleSave,
		onDiscard: () => {
			if (guestsSettings) {
				setLocalSettings(guestsSettings);
			}
			setLocalOtpEnabled(otpEnabled);
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

	const table = useReactTable({
		data: domainsData,
		columns: guestsTableColumns,
		getCoreRowModel: getCoreRowModel(),
		getFilteredRowModel: getFilteredRowModel(),
		onRowSelectionChange: setRowSelection,
		state: {
			rowSelection,
		},
	});

	const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
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

	const handleDeleteSelectedDomains = useCallback(() => {
		const selectedRows = table.getFilteredSelectedRowModel().rows;
		const domainsToDelete = selectedRows.map((row) => row.original.domain);

		setLocalSettings((prev) => ({
			...prev,
			domains: prev.domains?.filter((domain) => !domainsToDelete.includes(domain)) || [],
		}));
		setRowSelection({});
	}, [table]);

	const handleFilterChange = useCallback(
		(value: string | null) => {
			table.getColumn("domain")?.setFilterValue(value);
		},
		[table],
	);

	const tabError = getTabError("guests");
	const selectedCount = useMemo(() => table.getFilteredSelectedRowModel().rows.length, [table, rowSelection]);

	if (isInitialLoading("guests")) {
		return <TabInitialLoader />;
	}

	if (tabError) {
		return <TabErrorBlock message={tabError.message} onRetry={() => ensureGuestsLoaded(true)} />;
	}

	return (
		<>
			<StickyHeader
				title={
					<>
						{getAdminPageTitle(Page.GUESTS)} <Spinner size="small" show={isRefreshing("guests")} />
					</>
				}
				isScrolled={isScrolled}
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
			/>
			<FloatingAlert show={Boolean(saveError)} message={saveError} />

			<div className="px-6 space-y-6">
				<div>
					<h2 className="text-xl font-medium mb-4">{t("enterprise.admin.guests.general-settings")}</h2>
					<Field
						title={t("enterprise.admin.guests.otp-enabled")}
						className="items-center"
						control={() => (
							<Switch
								size="sm"
								id="otpEnabled"
								checked={localOtpEnabled}
								onCheckedChange={(checked) => {
									setLocalOtpEnabled(checked as boolean);
									if (checked) {
										setLocalSettings((prev) => ({
											...prev,
											whitelistEnabled: true,
										}));
									}
								}}
							/>
						)}
					/>
					<Description>{t("enterprise.admin.guests.otp-description")}</Description>
				</div>

				{localOtpEnabled && (
					<>
						<div>
							<Field
								title={t("enterprise.admin.guests.session-duration-hours")}
								className="items-center"
								control={() => (
									<Input
										id="sessionDurationHours"
										name="sessionDurationHours"
										type="number"
										value={localSettings.sessionDurationHours}
										onChange={handleInputChange}
										required
										min="1"
										className="w-24"
									/>
								)}
							/>
						</div>

						<div>
							<h2 className="text-xl font-medium mb-4">
								{t("enterprise.admin.guests.whitelist-settings")}
							</h2>

							<Field
								title={t("enterprise.admin.guests.whitelist-enabled")}
								className="items-center"
								control={() => (
									<Switch
										size="sm"
										id="whitelistEnabled"
										checked={localSettings.whitelistEnabled}
										onCheckedChange={(checked) =>
											setLocalSettings((prev) => ({
												...prev,
												whitelistEnabled: checked as boolean,
											}))
										}
									/>
								)}
							/>

							{localSettings.whitelistEnabled && (
								<div className="py-4">
									<TableInfoBlock title={t("enterprise.admin.guests.whitelist-domains")} />
									<Description>
										{t("enterprise.admin.guests.whitelist-domains-description")}
									</Description>

									<TableToolbar
										input={
											<TableToolbarTextInput
												placeholder={t("enterprise.admin.guests.whitelist-domains-placeholder")}
												value={(table.getColumn("domain")?.getFilterValue() as string) ?? ""}
												onChange={handleFilterChange}
											/>
										}
									>
										<AlertDeleteDialog
											selectedCount={selectedCount}
											hidden={!selectedCount}
											onConfirm={handleDeleteSelectedDomains}
										/>
										<GuestsToolbarAddBtn
											key="add-domain"
											onAddDomain={handleAddDomain}
											existingDomains={localSettings.domains || []}
										/>
									</TableToolbar>

									<TableComponent<Domain> table={table} columns={guestsTableColumns} />
								</div>
							)}
						</div>
					</>
				)}
			</div>
		</>
	);
};

export default GuestsComponent;
