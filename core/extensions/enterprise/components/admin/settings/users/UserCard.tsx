import { getRoleName } from "@ext/enterprise/components/admin/settings/components/roles/Access";
import { GroupPickerDialog } from "@ext/enterprise/components/admin/settings/groups/dialog/GroupPickerDialog";
import type { AccessChange } from "@ext/enterprise/components/admin/settings/members/model/AccessChange";
import type { MemberAggregate, UserMember } from "@ext/enterprise/components/admin/settings/members/model/Member";
import { RepoAccessPickerDialog } from "@ext/enterprise/components/admin/settings/resources/dialog/RepoAccessPickerDialog";
import { useUserCard } from "@ext/enterprise/components/admin/settings/users/hooks/useUserCard";
import { AddButton } from "@ext/enterprise/components/admin/ui-kit/AddButton";
import { CancelButton } from "@ext/enterprise/components/admin/ui-kit/CancelButton";
import { CloseConfirmationDialog } from "@ext/enterprise/components/admin/ui-kit/CloseConfirmationDialog";
import { DeleteSelectedButton } from "@ext/enterprise/components/admin/ui-kit/DeleteSelectedButton";
import { SaveButton } from "@ext/enterprise/components/admin/ui-kit/SaveButton";
import { SheetComponent } from "@ext/enterprise/components/admin/ui-kit/SheetComponent";
import { SheetTitleValue } from "@ext/enterprise/components/admin/ui-kit/SheetTitleValue";
import { SelectableTable } from "@ext/enterprise/components/admin/ui-kit/table/SelectableTable";
import { WithTooltip } from "@ext/enterprise/components/admin/ui-kit/WithTooltip";
import t from "@ext/localization/locale/translate";
import { Divider } from "@ui-kit/Divider";
import { Field } from "@ui-kit/Field";
import { TextInput } from "@ui-kit/Input";
import { FieldLabel } from "@ui-kit/Label";
import { SwitchField } from "@ui-kit/Switch";

interface UserCardProps {
	open: boolean;
	onClose: () => void;
	aggregate: MemberAggregate;
	user?: UserMember;
	onApply: (changes: AccessChange[]) => Promise<void>;
}

export const UserCard = (props: UserCardProps) => {
	const { open } = props;
	const {
		data,
		access,
		group,
		form,
		isAdd,
		aggregate,
		roleRules,
		editorSlotsFull,
		editorCount,
		effectiveEditorsUsed,
	} = useUserCard(props);

	return (
		<>
			<SheetComponent
				cancelButton={
					<>
						<CancelButton
							onClick={(e) => {
								e.preventDefault();
								form.requestClose();
							}}
						/>
					</>
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
				error={form.sheetError}
				isOpen={open}
				onOpenChange={(next) => !next && form.requestClose()}
				sheetContent={
					<div className="flex flex-col gap-6">
						<div className="flex flex-col gap-4">
							<Field
								control={(props) => (
									<TextInput
										disabled={!isAdd}
										onBlur={data.onEmailBlur}
										onChange={(e) => data.setEmail(e)}
										placeholder={t("enterprise.admin.users.email-placeholder")}
										value={data.email}
										{...props}
									/>
								)}
								error={data.emailError}
								layout="vertical"
								readonly={!isAdd}
								required
								title={t("email")}
							/>
							<WithTooltip
								className="flex"
								tooltip={editorSlotsFull ? t("enterprise.admin.users.editor-slots-full") : undefined}
							>
								<SwitchField
									alignment="right"
									checked={data.isEditor}
									className="flex-1 justify-between"
									description={
										editorCount > 0 ? (
											<>
												{t("enterprise.admin.users.editor-hint")} ({effectiveEditorsUsed}/
												{editorCount} {t("enterprise.admin.users.editor-slots-used")})
											</>
										) : undefined
									}
									disabled={editorSlotsFull}
									label={t("enterprise.admin.users.editor")}
									onCheckedChange={editorSlotsFull ? undefined : (c) => data.setIsEditor(Boolean(c))}
									outline
								/>
							</WithTooltip>
							<WithTooltip
								className="flex"
								tooltip={
									!data.isEditor ? t("enterprise.admin.users.owner-requires-editor-hint") : undefined
								}
							>
								<SwitchField
									alignment="right"
									checked={data.isWorkspaceOwner}
									className="flex-1 justify-between"
									disabled={!data.isEditor}
									label={<>{getRoleName("workspaceOwner")}</>}
									onCheckedChange={!data.isEditor ? undefined : data.setWorkspaceOwner}
									outline
								/>
							</WithTooltip>
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
										<DeleteSelectedButton
											count={group.selected.length}
											onClick={group.removeSelected}
										/>
										<AddButton onClick={group.picker.open} />
									</>
								}
							/>
						</section>
					</div>
				}
				title={
					isAdd ? (
						t("enterprise.admin.users.adding")
					) : (
						<SheetTitleValue label={t("enterprise.admin.users.editing")} value={data.email} />
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
