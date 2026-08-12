import { useBulkGroupsCard } from "@ext/enterprise/components/admin/settings/groups/hooks/useBulkGroupsCard";
import type { AccessChange } from "@ext/enterprise/components/admin/settings/members/model/AccessChange";
import type { GroupMember, MemberAggregate } from "@ext/enterprise/components/admin/settings/members/model/Member";
import { RepoAccessPickerDialog } from "@ext/enterprise/components/admin/settings/resources/dialog/RepoAccessPickerDialog";
import { UserPickerDialog } from "@ext/enterprise/components/admin/settings/users/dialog/UserPickerDialog";
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
import { Divider } from "@ui-kit/Divider";
import { FieldLabel } from "@ui-kit/Label";

interface BulkGroupsCardProps {
	open: boolean;
	groups: GroupMember[];
	aggregate: MemberAggregate;
	onApply: (changes: AccessChange[]) => Promise<void>;
	onClose: () => void;
}

export const BulkGroupsCard = (props: BulkGroupsCardProps) => {
	const { open, groups } = props;
	const { access, user, form, aggregate, roleRules } = useBulkGroupsCard(props);

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
							<SelectableTable
								columns={access.columns}
								data={access.rows}
								getRowId={access.getId}
								onRowSelectionChange={access.setSelection}
								rowSelection={access.selection}
								rowVersions={access.rowVersions}
								searchColumnId={access.searchColumnId}
								searchPlaceholder={t("enterprise.admin.resources.find")}
								toolbarActions={
									<>
										<SelectionDropdown selectedCount={access.selected.length}>
											<AddToAllDropdownItem
												disabled={access.isApplyToAllDisabled}
												onSelect={access.addSelectedToAll}
											/>
											<DeleteDropdownItem onSelect={access.removeSelected} />
										</SelectionDropdown>
										<AddButton onClick={access.picker.open} />
									</>
								}
							/>
						</section>

						{user.show && (
							<>
								<Divider />
								<section className="flex flex-col gap-6">
									<FieldLabel className="text-base">{t("enterprise.admin.users.users")}</FieldLabel>
									<SelectableTable
										columns={user.columns}
										data={user.rows}
										getRowId={user.getId}
										onRowSelectionChange={user.setSelection}
										rowSelection={user.selection}
										searchColumnId={user.searchColumnId}
										searchPlaceholder={
											user.ssoEnabled
												? t("enterprise.admin.users.find")
												: t("enterprise.admin.users.find-by-email")
										}
										toolbarActions={
											<>
												<SelectionDropdown selectedCount={user.selected.length}>
													<AddToAllDropdownItem onSelect={user.addSelectedToAll} />
													<DeleteDropdownItem onSelect={user.removeSelected} />
												</SelectionDropdown>
												<AddButton onClick={user.picker.open} />
											</>
										}
									/>
								</section>
							</>
						)}
					</div>
				}
				title={
					<div className="flex items-baseline gap-2">
						{t("enterprise.admin.groups.editing-many")}
						<BigCounter>{groups.length}</BigCounter>
					</div>
				}
			/>

			<RepoAccessPickerDialog
				aggregate={aggregate}
				key={access.picker.key}
				onClose={access.picker.close}
				onPicked={access.picker.picked}
				open={access.picker.isOpen}
				preselected={access.preselected}
				roleRules={roleRules}
			/>

			{user.show && (
				<UserPickerDialog
					aggregate={aggregate}
					key={user.picker.key}
					onClose={user.picker.close}
					onPicked={user.picker.picked}
					open={user.picker.isOpen}
					preselected={user.preselected}
				/>
			)}

			<CloseConfirmationDialog
				isOpen={form.showUnsaved}
				onClose={form.close}
				onOpenChange={form.setShowUnsaved}
			/>
		</>
	);
};
