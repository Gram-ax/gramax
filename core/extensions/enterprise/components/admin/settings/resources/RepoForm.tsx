import { GroupAccessPickerDialog } from "@ext/enterprise/components/admin/settings/groups/dialog/GroupAccessPickerDialog";
import { GuestAccessPickerDialog } from "@ext/enterprise/components/admin/settings/guests/dialog/GuestAccessPickerDialog";
import { useRepoForm } from "@ext/enterprise/components/admin/settings/resources/hooks/useRepoForm";
import type { RepoFormState } from "@ext/enterprise/components/admin/settings/resources/hooks/useRepoFormState";
import { UserAccessPickerDialog } from "@ext/enterprise/components/admin/settings/users/dialog/UserAccessPickerDialog";
import { AddButton } from "@ext/enterprise/components/admin/ui-kit/AddButton";
import { DeleteSelectedButton } from "@ext/enterprise/components/admin/ui-kit/DeleteSelectedButton";
import { SelectableTable } from "@ext/enterprise/components/admin/ui-kit/table/SelectableTable";
import t from "@ext/localization/locale/translate";
import { AsyncSearchSelect } from "@ui-kit/AsyncSearchSelect";
import { Collapsible, CollapsibleContent } from "@ui-kit/Collapsible";
import { Counter } from "@ui-kit/Counter";
import { Divider } from "@ui-kit/Divider";
import { Field } from "@ui-kit/Field";
import { FieldLabel } from "@ui-kit/Label";
import { SwitchField } from "@ui-kit/Switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@ui-kit/Tabs";

interface RepoFormProps {
	state: RepoFormState;
}

export function RepoForm({ state }: RepoFormProps) {
	const { isAdd, data, group, guest, user, aggregate } = useRepoForm({ state });

	return (
		<div className="flex flex-col gap-6">
			{isAdd && (
				<Field
					control={() => (
						<AsyncSearchSelect
							emptyText={t("enterprise.admin.resources.repository-not-found")}
							loadOptions={data.loadRepoOptions}
							onChange={(option) => data.setRepoId(option.value as string)}
							placeholder={t("enterprise.admin.resources.select-repository-placeholder")}
							searchPlaceholder={t("enterprise.admin.search")}
							value={data.repoId ? { value: data.repoId, label: data.repoId } : null}
						/>
					)}
					description={t("enterprise.admin.resources.select-repository-description")}
					layout="vertical"
					required
					title={t("repository")}
				/>
			)}
			<Collapsible open={Boolean(data.repoId)}>
				<CollapsibleContent className="flex flex-col gap-6 overflow-visible data-[state=closed]:overflow-hidden">
					<Field
						control={() => (
							<div className="flex items-center gap-2">
								<AsyncSearchSelect
									emptyText={t("enterprise.admin.resources.protected-branch-not-found")}
									loadOptions={data.loadBranchOptions}
									onChange={(option) => data.setBranchValue(option.value as string)}
									onClear={data.handleBranchClear}
									placeholder={t("enterprise.admin.resources.select-main-branch-placeholder")}
									searchPlaceholder={t("enterprise.admin.search")}
									value={
										data.branchValue ? { value: data.branchValue, label: data.branchValue } : null
									}
								/>
							</div>
						)}
						layout="vertical"
						title={t("enterprise.admin.resources.main-branch")}
					/>

					<Collapsible className="-mt-6" open={Boolean(data.branchValue)}>
						<CollapsibleContent className="overflow-visible data-[state=closed]:overflow-hidden">
							<SwitchField
								alignment="right"
								checked={data.branchProtected ?? false}
								className="justify-between mt-4"
								description={t("enterprise.admin.resources.main-branch-protection-description")}
								disabled={!data.branchValue}
								id="mainBranchProtected"
								label={t("enterprise.admin.resources.main-branch-protection")}
								onCheckedChange={data.setBranchProtected}
								outline
							/>
						</CollapsibleContent>
					</Collapsible>

					<Divider />

					<section className="flex flex-col gap-6">
						<FieldLabel className="text-base">{t("enterprise.admin.accesses")}</FieldLabel>
						<Tabs defaultValue="groups">
							<TabsList className="w-full">
								<TabsTrigger className="flex flex-1 items-center justify-center gap-1.5" value="groups">
									{t("enterprise.admin.groups.groups")}
									<Counter variant="text">{group.rows.length}</Counter>
								</TabsTrigger>
								<TabsTrigger className="flex flex-1 items-center justify-center gap-1.5" value="users">
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
											<DeleteSelectedButton
												count={group.selected.length}
												onClick={() => group.remove(group.selected)}
											/>
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
											<DeleteSelectedButton
												count={user.selected.length}
												onClick={() => user.remove(user.selected)}
											/>
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
											<DeleteSelectedButton
												count={guest.selected.length}
												onClick={() => guest.remove(guest.selected)}
											/>
											<AddButton onClick={guest.picker.open} />
										</>
									}
								/>
							</TabsContent>
						</Tabs>
					</section>
				</CollapsibleContent>
			</Collapsible>

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
				repoId={data.repoId}
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
	);
}
