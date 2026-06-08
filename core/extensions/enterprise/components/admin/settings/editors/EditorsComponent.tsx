import { useSettings } from "@ext/enterprise/components/admin/contexts/SettingsContext";
import { FloatingAlert } from "@ext/enterprise/components/admin/ui-kit/FloatingAlert";
import { StickyHeader } from "@ext/enterprise/components/admin/ui-kit/StickyHeader";
import { TabErrorBlock } from "@ext/enterprise/components/admin/ui-kit/TabErrorBlock";
import { TabInitialLoader } from "@ext/enterprise/components/admin/ui-kit/TabInitialLoader";
import { TableToolbarTextInput } from "@ext/enterprise/components/admin/ui-kit/table/TableToolbarTextInput";
import { Page } from "@ext/enterprise/types/Page";
import { getAdminPageTitle } from "@ext/enterprise/utils/getAdminPageTitle";
import t from "@ext/localization/locale/translate";
import { getCoreRowModel, getFilteredRowModel, useReactTable } from "@ui-kit/DataTable";
import { useCallback, useEffect, useMemo, useState } from "react";
import { AlertDeleteDialog } from "../../ui-kit/AlertDeleteDialog";
import { TableComponent } from "../../ui-kit/table/TableComponent";
import { TableToolbar } from "../../ui-kit/table/TableToolbar";
import { UserToolbarAddBtn } from "../components/UserToolbarAddBtn";
import { editorsTableColumns } from "./config/EditorsTableConfig";
import type { Editor } from "./types/EditorsComponentTypes";

const EditorsComponent = () => {
	const { settings, updateEditors, ensureEditorsLoaded, getTabError, isInitialLoading } = useSettings();
	const editorSettings = settings?.editors;

	const [localEditors, setLocalEditors] = useState<string[]>(editorSettings?.editors || []);
	const [rowSelection, setRowSelection] = useState({});
	const [saveError, setSaveError] = useState<string | null>(null);

	const tableData = useMemo(() => localEditors.map((editor) => ({ id: editor, editor })), [localEditors]);

	useEffect(() => {
		if (editorSettings?.editors) {
			setLocalEditors(editorSettings.editors);
		}
	}, [editorSettings?.editors]);

	const table = useReactTable({
		data: tableData,
		columns: editorsTableColumns,
		getCoreRowModel: getCoreRowModel(),
		getFilteredRowModel: getFilteredRowModel(),
		onRowSelectionChange: setRowSelection,
		state: {
			rowSelection,
		},
	});

	// biome-ignore lint/correctness/useExhaustiveDependencies: idc
	const selectedCount = useMemo(() => table.getFilteredSelectedRowModel().rows.length, [table, rowSelection]);

	const saveEditors = useCallback(
		async (editors: string[]) => {
			if (!editorSettings) return;
			try {
				await updateEditors({ count: editorSettings.count, editors });
			} catch (e) {
				setSaveError(e?.message);
			}
		},
		[editorSettings, updateEditors],
	);

	// biome-ignore lint/correctness/useExhaustiveDependencies: idc
	const deleteSelected = useCallback(async () => {
		const selectedRows = table.getFilteredSelectedRowModel().rows;
		const selectedEditorIds = selectedRows.map((row) => row.original.editor);
		const updatedEditors = localEditors.filter((editor) => !selectedEditorIds.includes(editor));
		setLocalEditors(updatedEditors);
		setRowSelection({});

		await saveEditors(updatedEditors);
	}, [localEditors, saveEditors]);

	const handleAddEditors = useCallback(
		async (editors: string[]) => {
			const editorsToAdd = editors.filter((editor) => !localEditors.includes(editor));

			if (editorsToAdd.length) {
				const updatedEditors = [...localEditors, ...editorsToAdd];
				setLocalEditors(updatedEditors);

				await saveEditors(updatedEditors);
			}
		},
		[localEditors, saveEditors],
	);

	const handleFilterChange = useCallback(
		(value: string | null) => {
			table.getColumn("editor")?.setFilterValue(value);
		},
		[table],
	);

	const tabError = getTabError("editors");

	if (isInitialLoading("editors")) {
		return <TabInitialLoader />;
	}

	if (tabError) {
		return <TabErrorBlock message={tabError.message} onRetry={() => ensureEditorsLoaded(true)} />;
	}

	if (!editorSettings) return null;

	return (
		<div>
			<FloatingAlert message={saveError} show={Boolean(saveError)} />

			<StickyHeader
				title={
					<>
						{getAdminPageTitle(Page.EDITORS)}
						<span className="text-2xl font-normal">
							{localEditors.length}
							{editorSettings.count ? `/${editorSettings.count}` : ""}
						</span>
					</>
				}
			/>

			<div>
				<TableToolbar
					className="pt-0"
					input={
						<TableToolbarTextInput
							onChange={handleFilterChange}
							placeholder={t("enterprise.admin.editors.placeholder")}
							value={(table.getColumn("editor")?.getFilterValue() as string) ?? ""}
						/>
					}
				>
					<AlertDeleteDialog
						hidden={!selectedCount}
						onConfirm={deleteSelected}
						selectedCount={selectedCount}
					/>

					<UserToolbarAddBtn
						disable={localEditors.length >= editorSettings.count}
						existingUsers={localEditors}
						key="add-editor"
						limit={editorSettings.count}
						onAdd={handleAddEditors}
					/>
				</TableToolbar>

				<TableComponent<Editor> columns={editorsTableColumns} table={table} />
			</div>
		</div>
	);
};

export default EditorsComponent;
