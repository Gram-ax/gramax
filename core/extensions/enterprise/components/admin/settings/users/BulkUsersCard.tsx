import { GroupPickerDialog } from "@ext/enterprise/components/admin/settings/groups/dialog/GroupPickerDialog";
import type { AccessChange } from "@ext/enterprise/components/admin/settings/members/model/AccessChange";
import type { MemberAggregate, UserMember } from "@ext/enterprise/components/admin/settings/members/model/Member";
import { RepoAccessPickerDialog } from "@ext/enterprise/components/admin/settings/resources/dialog/RepoAccessPickerDialog";
import { useBulkUsersCard } from "@ext/enterprise/components/admin/settings/users/hooks/useBulkUsersCard";
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

interface BulkUsersCardProps {
	open: boolean;
	onClose: () => void;
	users: UserMember[];
	aggregate: MemberAggregate;
	onApply: (changes: AccessChange[]) => Promise<void>;
}

export const BulkUsersCard = (props: BulkUsersCardProps) => {
	const { open, users } = props;
	const { access, form, group, aggregate, roleRules } = useBulkUsersCard(props);

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

						<Divider />

						<section className="flex flex-col gap-6">
							<FieldLabel className="text-base">{t("enterprise.admin.groups.groups")}</FieldLabel>
							<SelectableTable
								columns={group.columns}
								data={group.rows}
								getRowId={group.getId}
								onRowSelectionChange={group.setSelection}
								rowSelection={group.selection}
								searchColumnId={group.searchColumnId}
								searchPlaceholder={t("enterprise.admin.groups.find")}
								toolbarActions={
									<>
										<SelectionDropdown selectedCount={group.selected.length}>
											<AddToAllDropdownItem onSelect={group.addSelectedToAll} />
											<DeleteDropdownItem onSelect={group.removeSelected} />
										</SelectionDropdown>
										<AddButton onClick={group.picker.open} />
									</>
								}
							/>
						</section>
					</div>
				}
				title={
					<div className="flex items-baseline gap-2">
						{t("enterprise.admin.users.editing-many")}
						<BigCounter>{users.length}</BigCounter>
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

			<GroupPickerDialog
				aggregate={aggregate}
				key={group.picker.key}
				onClose={group.picker.close}
				onPicked={group.picker.picked}
				open={group.picker.isOpen}
				preselected={group.preselected}
			/>

			<CloseConfirmationDialog
				isOpen={form.showUnsaved}
				onClose={form.close}
				onOpenChange={form.setShowUnsaved}
			/>
		</>
	);
};
