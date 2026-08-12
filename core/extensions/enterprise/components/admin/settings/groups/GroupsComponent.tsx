import { useAdminHeader } from "@ext/enterprise/components/admin/hooks/useAdminHeader";
import { BulkGroupsCard } from "@ext/enterprise/components/admin/settings/groups/BulkGroupsCard";
import { GroupCard } from "@ext/enterprise/components/admin/settings/groups/GroupCard";
import { useGroupsViewModel } from "@ext/enterprise/components/admin/settings/groups/hooks/useGroupsViewModel";
import { TypeFilterDropdown } from "@ext/enterprise/components/admin/settings/users/components/TypeFilterDropdown";
import { AddButton } from "@ext/enterprise/components/admin/ui-kit/AddButton";
import { DeleteConfirmationDialog } from "@ext/enterprise/components/admin/ui-kit/DeleteConfirmationDialog";
import { Spinner } from "@ext/enterprise/components/admin/ui-kit/Spinner";
import { TabErrorBlock } from "@ext/enterprise/components/admin/ui-kit/TabErrorBlock";
import { SelectableTable } from "@ext/enterprise/components/admin/ui-kit/table/SelectableTable";
import {
	DeleteDropdownItem,
	EditDropdownItem,
	SelectionDropdown,
} from "@ext/enterprise/components/admin/ui-kit/table/SelectionDropdown";
import { WithTooltip } from "@ext/enterprise/components/admin/ui-kit/WithTooltip";
import { Page } from "@ext/enterprise/types/Page";
import { getAdminPageTitle } from "@ext/enterprise/utils/getAdminPageTitle";
import t from "@ext/localization/locale/translate";

const GroupsComponent = () => {
	const { aggregate, applyChanges, card, data, form } = useGroupsViewModel();

	useAdminHeader({
		title: (
			<>
				{getAdminPageTitle(Page.GROUPS)}
				{form.isLoading && <Spinner className="self-center" size="small" />}
			</>
		),
		titleClassName: "items-baseline",
	});

	if (form.tabError) return <TabErrorBlock code={form.tabError} onRetry={form.retry} />;

	return (
		<div className="h-full flex flex-col gap-2">
			{data.ssoEnabled && (
				<span className="text-sm text-muted">{t("enterprise.admin.groups.use-search-for-sso")}</span>
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
				searchPlaceholder={t("enterprise.admin.groups.find")}
				toolbarActions={
					<>
						<SelectionDropdown selectedCount={data.selected.length}>
							<EditDropdownItem onSelect={card.bulk.openSelected} />
							<WithTooltip
								tooltip={
									data.delete.disabled
										? t("enterprise.admin.groups.errors.delete-disabled")
										: undefined
								}
							>
								<DeleteDropdownItem disabled={data.delete.disabled} onSelect={data.delete.open} />
							</WithTooltip>
						</SelectionDropdown>
						<AddButton onClick={() => card.single.openWith(null)} />
					</>
				}
				toolbarLeftActions={
					<TypeFilterDropdown<"owner">
						onSelectType={data.filter.type.set}
						selectedType={data.filter.type.selected}
						types={["owner"]}
					/>
				}
			/>

			<GroupCard
				aggregate={aggregate}
				group={card.single.data}
				key={card.single.session}
				onApply={applyChanges}
				onClose={card.single.close}
				open={card.single.isOpen}
			/>

			{card.bulk.data && (
				<BulkGroupsCard
					aggregate={aggregate}
					groups={card.bulk.data}
					key={card.bulk.session}
					onApply={applyChanges}
					onClose={card.bulk.close}
					open={card.bulk.isOpen}
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

export default GroupsComponent;
