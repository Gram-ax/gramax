import Input from "@components/Atoms/Input";
import { useAdminHeader } from "@ext/enterprise/components/admin/hooks/useAdminHeader";
import { PluginsEmptyState } from "@ext/enterprise/components/admin/settings/plugins/PluginPage/components/PluginsEmptyState";
import type { PluginTableRow } from "@ext/enterprise/components/admin/settings/plugins/PluginPage/PluginsTableConfig";
import { Button } from "@ext/enterprise/components/admin/ui-kit/Button";
import { DeleteSelectedButton } from "@ext/enterprise/components/admin/ui-kit/DeleteSelectedButton";
import { Spinner } from "@ext/enterprise/components/admin/ui-kit/Spinner";
import { TabErrorBlock } from "@ext/enterprise/components/admin/ui-kit/TabErrorBlock";
import { TabInitialLoader } from "@ext/enterprise/components/admin/ui-kit/TabInitialLoader";
import { SelectableTable } from "@ext/enterprise/components/admin/ui-kit/table/SelectableTable";
import { Page } from "@ext/enterprise/types/Page";
import { getAdminPageTitle } from "@ext/enterprise/utils/getAdminPageTitle";
import t from "@ext/localization/locale/translate";
import { Icon } from "@ui-kit/Icon";
import { usePluginsViewModel } from "./usePluginsViewModel";

const getPluginRowId = (row: PluginTableRow) => row.id;

const PluginsComponent = () => {
	const {
		columns,
		tableData,
		hasPlugins,
		fileInputRef,
		triggerFileSelect,
		handleFolderSelect,
		handleDeleteSelected,
		rowSelection,
		setRowSelection,
		selectedPlugins,
		isInitialLoading,
		isRefreshing,
		tabError,
		retry,
	} = usePluginsViewModel();

	const isContentUnavailable = isInitialLoading || Boolean(tabError);

	useAdminHeader({
		title: (
			<>
				{getAdminPageTitle(Page.PLUGINS)} <Spinner show={isRefreshing} size="small" />
			</>
		),
		actions: isContentUnavailable ? undefined : (
			<Button onClick={triggerFileSelect}>
				<Icon icon="plus" size="md" />
				{t("plugins.list.add-button")}
			</Button>
		),
	});

	if (isInitialLoading) return <TabInitialLoader />;
	if (tabError) return <TabErrorBlock code={tabError} onRetry={retry} />;

	return (
		<div>
			<Input
				ref={fileInputRef}
				type="file"
				{...{ webkitdirectory: "", directory: "" }}
				multiple
				onChange={handleFolderSelect}
				style={{ display: "none" }}
			/>

			{hasPlugins ? (
				<SelectableTable<PluginTableRow>
					columns={columns}
					data={tableData}
					getRowId={getPluginRowId}
					onRowSelectionChange={setRowSelection}
					rowSelection={rowSelection}
					searchColumnId="name"
					searchPlaceholder={t("enterprise.admin.plugins.find")}
					toolbarActions={
						<DeleteSelectedButton
							count={selectedPlugins.length}
							onClick={() => handleDeleteSelected(selectedPlugins)}
						/>
					}
				/>
			) : (
				<PluginsEmptyState onUploadClick={triggerFileSelect} />
			)}
		</div>
	);
};

export default PluginsComponent;
