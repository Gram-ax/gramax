import { useAdminHeader } from "@ext/enterprise/components/admin/hooks/useAdminHeader";
import { BulkUsersCard } from "@ext/enterprise/components/admin/settings/users/BulkUsersCard";
import { TypeFilterDropdown } from "@ext/enterprise/components/admin/settings/users/components/TypeFilterDropdown";
import { useUsersViewModel } from "@ext/enterprise/components/admin/settings/users/hooks/useUsersViewModel";
import { UserCard } from "@ext/enterprise/components/admin/settings/users/UserCard";
import { AddButton } from "@ext/enterprise/components/admin/ui-kit/AddButton";
import { DeleteConfirmationDialog } from "@ext/enterprise/components/admin/ui-kit/DeleteConfirmationDialog";
import { EditSelectedButton } from "@ext/enterprise/components/admin/ui-kit/EditSelectedButton";
import { Spinner } from "@ext/enterprise/components/admin/ui-kit/Spinner";
import { TabErrorBlock } from "@ext/enterprise/components/admin/ui-kit/TabErrorBlock";
import { SelectableTable } from "@ext/enterprise/components/admin/ui-kit/table/SelectableTable";
import {
	DeleteDropdownItem,
	EditDropdownItem,
	SelectionDropdown,
} from "@ext/enterprise/components/admin/ui-kit/table/SelectionDropdown";
import { Page } from "@ext/enterprise/types/Page";
import { getAdminPageTitle } from "@ext/enterprise/utils/getAdminPageTitle";
import t from "@ext/localization/locale/translate";

const UsersComponent = () => {
	const { aggregate, applyChanges, card, data, form, occupiedEditors, totalEditors } = useUsersViewModel();

	useAdminHeader({
		title: (
			<div className="flex gap-2 items-baseline">
				{getAdminPageTitle(Page.USERS)}
				{!form.isLoading && !form.tabError && (
					<span className="text-sm font-normal text-muted">
						{t("enterprise.admin.users.editors")}: {occupiedEditors}/{totalEditors}
					</span>
				)}
				{form.isLoading && <Spinner className="self-center" size="small" />}
			</div>
		),
		titleClassName: "items-baseline",
	});

	if (form.tabError) return <TabErrorBlock code={form.tabError} onRetry={form.retry} />;

	return (
		<div className="h-full flex flex-col gap-2">
			{data.ssoEnabled && (
				<span className="text-sm text-muted">{t("enterprise.admin.users.use-search-for-sso")}</span>
			)}
			<SelectableTable
				className="flex flex-col min-h-0"
				columns={data.columns}
				data={data.rows}
				getRowId={data.getId}
				isLoading={data.isLoading}
				onRowClick={card.single.openWith}
				onRowSelectionChange={data.setSelection}
				onSearchChange={data.filter.query.set}
				rowSelection={data.selection}
				searchPlaceholder={
					data.ssoEnabled ? t("enterprise.admin.users.find") : t("enterprise.admin.users.find-by-email")
				}
				toolbarActions={
					<>
						{data.ssoEnabled ? (
							<EditSelectedButton count={data.selected.length} onClick={card.bulk.openSelected} />
						) : (
							<SelectionDropdown selectedCount={data.selected.length}>
								<EditDropdownItem onSelect={card.bulk.openSelected} />
								<DeleteDropdownItem onSelect={data.delete.open} />
							</SelectionDropdown>
						)}
						{!data.ssoEnabled && <AddButton onClick={() => card.single.openWith(null)} />}
					</>
				}
				toolbarLeftActions={
					<TypeFilterDropdown onSelectType={data.filter.type.set} selectedType={data.filter.type.selected} />
				}
			/>

			<UserCard
				aggregate={aggregate}
				key={card.single.session}
				onApply={applyChanges}
				onClose={card.single.close}
				open={card.single.isOpen}
				user={card.single.data}
			/>

			{card.bulk.data && (
				<BulkUsersCard
					aggregate={aggregate}
					key={card.bulk.session}
					onApply={applyChanges}
					onClose={card.bulk.close}
					open={card.bulk.isOpen}
					users={card.bulk.data}
				/>
			)}

			<DeleteConfirmationDialog
				isOpen={data.delete.isOpen}
				loading={data.delete.isDeleting}
				onConfirm={data.delete.confirm}
				onOpenChange={data.delete.setIsOpen}
				selectedCount={data.selected.length}
			/>
		</div>
	);
};

export default UsersComponent;
