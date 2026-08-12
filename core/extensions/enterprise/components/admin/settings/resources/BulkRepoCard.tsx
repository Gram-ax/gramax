import { GroupAccessPickerDialog } from "@ext/enterprise/components/admin/settings/groups/dialog/GroupAccessPickerDialog";
import { GuestAccessPickerDialog } from "@ext/enterprise/components/admin/settings/guests/dialog/GuestAccessPickerDialog";
import type { AccessChange } from "@ext/enterprise/components/admin/settings/members/model/AccessChange";
import type { GesRepo, MemberAggregate } from "@ext/enterprise/components/admin/settings/members/model/Member";
import { useBulkRepoCard } from "@ext/enterprise/components/admin/settings/resources/hooks/useBulkRepoCard";
import { UserAccessPickerDialog } from "@ext/enterprise/components/admin/settings/users/dialog/UserAccessPickerDialog";
import { AddButton } from "@ext/enterprise/components/admin/ui-kit/AddButton";
import { CancelButton } from "@ext/enterprise/components/admin/ui-kit/CancelButton";
import { CloseConfirmationDialog } from "@ext/enterprise/components/admin/ui-kit/CloseConfirmationDialog";
import { BigCounter } from "@ext/enterprise/components/admin/ui-kit/Counter";
import { SaveButton } from "@ext/enterprise/components/admin/ui-kit/SaveButton";
import { SheetComponent } from "@ext/enterprise/components/admin/ui-kit/SheetComponent";
import { SelectableTable } from "@ext/enterprise/components/admin/ui-kit/table/SelectableTable";
import {
	AddToAllDropdownItem,
	DeleteDropdownItem,
	SelectionDropdown,
} from "@ext/enterprise/components/admin/ui-kit/table/SelectionDropdown";
import t from "@ext/localization/locale/translate";
import { Counter } from "@ui-kit/Counter";
import { FieldLabel } from "@ui-kit/Label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@ui-kit/Tabs";

interface BulkRepoCardProps {
	open: boolean;
	repos: GesRepo[];
	aggregate: MemberAggregate;
	onApply: (changes: AccessChange[]) => Promise<void>;
	onClose: () => void;
}

export const BulkRepoCard = (props: BulkRepoCardProps) => {
	const { open, repos } = props;
	const { group, user, guest, form, aggregate } = useBulkRepoCard(props);

	return (
		<>
			<SheetComponent
				cancelButton={
					<CancelButton
						onClick={(e) => {
							e.preventDefault();
							form.requestClose();
						}}
					/>
				}
				confirmButton={
					<SaveButton
						isSaving={form.saving}
						onClick={(e) => {
							e.preventDefault();
							form.submit();
						}}
					/>
				}
				connectionError={form.saveError}
				isOpen={open}
				onOpenChange={(next) => !next && form.requestClose()}
				sheetContent={
					<div className="flex flex-col gap-6">
						<section className="flex flex-col gap-6">
							<FieldLabel className="text-base">{t("enterprise.admin.accesses")}</FieldLabel>
							<Tabs defaultValue="groups">
								<TabsList className="w-full">
									<TabsTrigger
										className="flex flex-1 items-center justify-center gap-1.5"
										value="groups"
									>
										{t("enterprise.admin.groups.groups")}
										<Counter variant="text">{group.rows.length}</Counter>
									</TabsTrigger>
									<TabsTrigger
										className="flex flex-1 items-center justify-center gap-1.5"
										value="users"
									>
										{t("enterprise.admin.users.users")}
										<Counter variant="text">{user.rows.length}</Counter>
									</TabsTrigger>
									<TabsTrigger
										className="flex flex-1 items-center justify-center gap-1.5"
										value="external-users"
									>
										{t("enterprise.admin.guests.guests")}
										<Counter variant="text">{guest.rows.length}</Counter>
									</TabsTrigger>
								</TabsList>
								<TabsContent className="mt-6 focus-visible:shadow-none" tabIndex={-1} value="groups">
									<SelectableTable
										columns={group.columns}
										data={group.rows}
										getRowId={group.getId}
										onRowSelectionChange={group.setSelection}
										rowSelection={group.selection}
										rowVersions={group.rowVersions}
										searchColumnId={group.searchColumnId}
										searchPlaceholder={t("enterprise.admin.groups.find")}
										toolbarActions={
											<>
												<SelectionDropdown selectedCount={group.selected.length}>
													<AddToAllDropdownItem
														disabled={group.isApplyToAllDisabled}
														onSelect={group.addSelectedToAll}
													/>
													<DeleteDropdownItem onSelect={group.removeSelected} />
												</SelectionDropdown>
												<AddButton onClick={group.picker.open} />
											</>
										}
									/>
								</TabsContent>
								<TabsContent className="mt-6 focus-visible:shadow-none" tabIndex={-1} value="users">
									<SelectableTable
										columns={user.columns}
										data={user.rows}
										getRowId={user.getId}
										onRowSelectionChange={user.setSelection}
										rowSelection={user.selection}
										rowVersions={user.rowVersions}
										searchColumnId={user.searchColumnId}
										searchPlaceholder={t("enterprise.admin.users.find-by-email")}
										toolbarActions={
											<>
												<SelectionDropdown selectedCount={user.selected.length}>
													<AddToAllDropdownItem
														disabled={user.isApplyToAllDisabled}
														onSelect={user.addSelectedToAll}
													/>
													<DeleteDropdownItem onSelect={user.removeSelected} />
												</SelectionDropdown>
												<AddButton onClick={user.picker.open} />
											</>
										}
									/>
								</TabsContent>
								<TabsContent
									className="mt-6 focus-visible:shadow-none"
									tabIndex={-1}
									value="external-users"
								>
									<SelectableTable
										columns={guest.columns}
										data={guest.rows}
										getRowId={guest.getId}
										onRowSelectionChange={guest.setSelection}
										rowSelection={guest.selection}
										rowVersions={guest.rowVersions}
										searchColumnId={guest.searchColumnId}
										searchPlaceholder={t("enterprise.admin.guests.find-readers")}
										toolbarActions={
											<>
												<SelectionDropdown selectedCount={guest.selected.length}>
													<AddToAllDropdownItem
														disabled={guest.isApplyToAllDisabled}
														onSelect={guest.addSelectedToAll}
													/>
													<DeleteDropdownItem onSelect={guest.removeSelected} />
												</SelectionDropdown>
												<AddButton onClick={guest.picker.open} />
											</>
										}
									/>
								</TabsContent>
							</Tabs>
						</section>

						<GroupAccessPickerDialog
							aggregate={aggregate}
							key={group.picker.key}
							onClose={group.picker.close}
							onPicked={group.picker.picked}
							open={group.picker.isOpen}
							preselected={group.preselected}
						/>

						<UserAccessPickerDialog
							aggregate={aggregate}
							key={user.picker.key}
							onClose={user.picker.close}
							onPicked={user.picker.picked}
							open={user.picker.isOpen}
							preselected={user.preselected}
							repoId={undefined}
						/>

						<GuestAccessPickerDialog
							aggregate={aggregate}
							domains={guest.domain.whitelist}
							key={guest.picker.key}
							onClose={guest.picker.close}
							onPicked={guest.picker.picked}
							open={guest.picker.isOpen}
							preselected={guest.preselected}
							whitelistEnabled={guest.domain.whitelistEnabled}
						/>
					</div>
				}
				title={
					<div className="flex items-baseline gap-2">
						{t("enterprise.admin.resources.editing-many")}
						<BigCounter>{repos.length}</BigCounter>
					</div>
				}
			/>

			<CloseConfirmationDialog
				isOpen={form.showUnsaved}
				onClose={form.close}
				onOpenChange={form.setShowUnsaved}
			/>
		</>
	);
};
