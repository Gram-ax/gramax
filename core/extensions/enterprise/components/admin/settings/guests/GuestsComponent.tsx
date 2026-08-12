import { DeleteSelectedButton } from "@ext/enterprise/components/admin/ui-kit/DeleteSelectedButton";
import { SettingsPageLayout } from "@ext/enterprise/components/admin/ui-kit/SettingsPageLayout";
import { SettingsSection } from "@ext/enterprise/components/admin/ui-kit/SettingsSection";
import { SelectableTable } from "@ext/enterprise/components/admin/ui-kit/table/SelectableTable";
import { Page } from "@ext/enterprise/types/Page";
import t from "@ext/localization/locale/translate";
import { Description } from "@ui-kit/Description";
import { Field } from "@ui-kit/Field";
import { Input } from "@ui-kit/Input";
import { Switch } from "@ui-kit/Switch";
import { GuestsToolbarAddBtn } from "./components/GuestsToolbarAddBtn";
import { useGuestsViewModel } from "./hooks/useGuestsViewModel";
import type { Domain } from "./types/GuestsComponent";

const GuestsComponent = () => {
	const { domain, form, setting } = useGuestsViewModel();

	return (
		<>
			<SettingsPageLayout
				isInitialLoading={form.isInitialLoading}
				isRefreshing={form.isRefreshing}
				isSaveDisabled={form.isSaveDisabled}
				isSaving={form.isSaving}
				onRetry={form.retry}
				onSave={form.onSave}
				page={Page.GUESTS}
				saveError={form.saveError}
				tabError={form.tabError}
			>
				<SettingsSection title={t("enterprise.admin.guests.general-settings")}>
					<Field
						className="items-center"
						control={() => (
							<Switch
								checked={setting.otpEnabled}
								id="otpEnabled"
								onCheckedChange={setting.onOtpChange}
								size="sm"
							/>
						)}
						title={t("enterprise.admin.guests.otp-enabled")}
					/>
					<Description>{t("enterprise.admin.guests.otp-description")}</Description>
				</SettingsSection>

				{setting.otpEnabled && (
					<>
						<Field
							className="items-center"
							control={() => (
								<Input
									className="w-24"
									id="sessionDurationHours"
									min="1"
									name="sessionDurationHours"
									onChange={setting.handleSessionChange}
									required
									type="number"
									value={setting.localSettings.sessionDurationHours}
								/>
							)}
							title={t("enterprise.admin.guests.session-duration-hours")}
						/>

						<SettingsSection title={t("enterprise.admin.guests.whitelist-settings")}>
							<Field
								className="items-center"
								control={() => (
									<Switch
										checked={setting.localSettings.whitelistEnabled}
										id="whitelistEnabled"
										onCheckedChange={(checked) =>
											setting.setLocalSettings((prev) => ({
												...prev,
												whitelistEnabled: checked as boolean,
											}))
										}
										size="sm"
									/>
								)}
								title={t("enterprise.admin.guests.whitelist-enabled")}
							/>

							{setting.localSettings.whitelistEnabled && (
								<SettingsSection
									className="py-4"
									description={t("enterprise.admin.guests.whitelist-domains-description")}
									title={t("enterprise.admin.guests.whitelist-domains")}
									titleClassName="text-sm"
								>
									<SelectableTable<Domain>
										className="mt-4"
										columns={domain.columns}
										data={domain.rows}
										getRowId={domain.getId}
										onRowSelectionChange={domain.setSelection}
										rowSelection={domain.selection}
										searchColumnId={domain.searchColumnId}
										searchPlaceholder={t("enterprise.admin.guests.domains.find")}
										toolbarActions={
											<>
												<DeleteSelectedButton
													count={domain.selected.length}
													onClick={domain.removeSelected}
												/>
												<GuestsToolbarAddBtn
													existingDomains={setting.localSettings.domains || []}
													key="add-domain"
													onAddDomain={domain.add}
												/>
											</>
										}
									/>
								</SettingsSection>
							)}
						</SettingsSection>
					</>
				)}
			</SettingsPageLayout>
		</>
	);
};

export default GuestsComponent;
