import { getRoleName } from "@ext/enterprise/components/admin/settings/components/roles/Access";
import { useGroupCard } from "@ext/enterprise/components/admin/settings/groups/hooks/useGroupCard";
import type { AccessChange } from "@ext/enterprise/components/admin/settings/members/model/AccessChange";
import type { GroupMember, MemberAggregate } from "@ext/enterprise/components/admin/settings/members/model/Member";
import { RepoAccessPickerDialog } from "@ext/enterprise/components/admin/settings/resources/dialog/RepoAccessPickerDialog";
import { UserPickerDialog } from "@ext/enterprise/components/admin/settings/users/dialog/UserPickerDialog";
import { AddButton } from "@ext/enterprise/components/admin/ui-kit/AddButton";
import { CancelButton } from "@ext/enterprise/components/admin/ui-kit/CancelButton";
import { CloseConfirmationDialog } from "@ext/enterprise/components/admin/ui-kit/CloseConfirmationDialog";
import { DeleteSelectedButton } from "@ext/enterprise/components/admin/ui-kit/DeleteSelectedButton";
import { SaveButton } from "@ext/enterprise/components/admin/ui-kit/SaveButton";
import { SheetComponent } from "@ext/enterprise/components/admin/ui-kit/SheetComponent";
import { SheetTitleValue } from "@ext/enterprise/components/admin/ui-kit/SheetTitleValue";
import { SelectableTable } from "@ext/enterprise/components/admin/ui-kit/table/SelectableTable";
import t from "@ext/localization/locale/translate";
import { Divider } from "@ui-kit/Divider";
import { Field } from "@ui-kit/Field";
import { TextInput } from "@ui-kit/Input";
import { FieldLabel } from "@ui-kit/Label";
import { SwitchField } from "@ui-kit/Switch";

interface GroupCardProps {
	open: boolean;
	group?: GroupMember;
	aggregate: MemberAggregate;
	onApply: (changes: AccessChange[]) => Promise<void>;
	onClose: () => void;
}

export const GroupCard = (props: GroupCardProps) => {
	const { open } = props;
	const { data, access, user, form, isAdd, aggregate, roleRules } = useGroupCard(props);

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
					<form className="flex flex-col gap-6" onSubmit={(e) => e.preventDefault()}>
						<div className="flex flex-col gap-4">
							<Field
								control={(ctrlProps) => (
									<TextInput
										disabled={data.nameReadonly}
										onBlur={data.onNameBlur}
										onChange={data.setName}
										placeholder={t("enterprise.admin.groups.name-placeholder")}
										value={data.name}
										{...ctrlProps}
									/>
								)}
								error={data.nameError}
								layout="vertical"
								readonly={data.nameReadonly}
								required
								title={t("name")}
							/>

							<SwitchField
								alignment="right"
								checked={data.isWorkspaceOwner}
								className="flex-1 justify-between"
								label={<>{getRoleName("workspaceOwner")}</>}
								onCheckedChange={data.setWorkspaceOwner}
								outline
							/>
						</div>

						<Divider />

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
										<DeleteSelectedButton
											count={access.selected.length}
											onClick={access.removeSelected}
										/>
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
												<DeleteSelectedButton
													count={user.selected.length}
													onClick={user.removeSelected}
												/>
												<AddButton onClick={user.picker.open} />
											</>
										}
									/>
								</section>
							</>
						)}
					</form>
				}
				title={
					isAdd ? (
						t("enterprise.admin.groups.adding")
					) : (
						<SheetTitleValue label={t("enterprise.admin.groups.editing")} value={data.name} />
					)
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
