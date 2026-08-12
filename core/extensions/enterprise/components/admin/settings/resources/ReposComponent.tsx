import { useAdminHeader } from "@ext/enterprise/components/admin/hooks/useAdminHeader";
import { BulkRepoCard } from "@ext/enterprise/components/admin/settings/resources/BulkRepoCard";
import { useReposViewModel } from "@ext/enterprise/components/admin/settings/resources/hooks/useReposViewModel";
import { RepoCard } from "@ext/enterprise/components/admin/settings/resources/RepoCard";
import { AddButton } from "@ext/enterprise/components/admin/ui-kit/AddButton";
import { BigCounter } from "@ext/enterprise/components/admin/ui-kit/Counter";
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

const ReposComponent = () => {
	const { card, data, form, aggregate, applyChanges } = useReposViewModel();

	useAdminHeader({
		title: (
			<>
				{getAdminPageTitle(Page.RESOURCES)}
				{data.isLoading ? (
					<Spinner className="self-center" size="small" />
				) : (
					!form.tabError && <BigCounter>{data.rows.length}</BigCounter>
				)}
			</>
		),
		titleClassName: "items-baseline",
	});

	if (form.tabError) return <TabErrorBlock code={form.tabError} onRetry={form.retry} />;

	return (
		<div className="h-full">
			<SelectableTable
				className="flex flex-col h-full"
				columns={data.columns}
				data={data.rows}
				getRowId={data.getId}
				isLoading={data.isLoading}
				onRowClick={card.single.openWith}
				onRowSelectionChange={data.setRowSelection}
				rowSelection={data.rowSelection}
				searchColumnId={data.searchColumnId}
				searchPlaceholder={t("enterprise.admin.resources.find")}
				toolbarActions={
					<>
						<SelectionDropdown selectedCount={data.selected.length}>
							<EditDropdownItem onSelect={card.bulk.openSelected} />
							<WithTooltip
								tooltip={
									data.selectedHasBase
										? t("enterprise.admin.resources.errors.base-not-deletable")
										: undefined
								}
							>
								<DeleteDropdownItem disabled={data.selectedHasBase} onSelect={data.delete.open} />
							</WithTooltip>
						</SelectionDropdown>
						<AddButton onClick={() => card.single.openWith(null)} />
					</>
				}
			/>

			{card.bulk.data && (
				<BulkRepoCard
					aggregate={aggregate}
					key={card.bulk.session}
					onApply={applyChanges}
					onClose={card.bulk.close}
					open={card.bulk.isOpen}
					repos={card.bulk.data}
				/>
			)}

			<RepoCard
				aggregate={aggregate}
				key={card.single.session}
				onApply={applyChanges}
				onClose={card.single.close}
				open={card.single.isOpen}
				repo={card.single.data}
				repoCandidates={data.candidates}
			/>

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

export default ReposComponent;
