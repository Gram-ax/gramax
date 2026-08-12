import { CancelButton } from "@ext/enterprise/components/admin/ui-kit/CancelButton";
import { CloseConfirmationDialog } from "@ext/enterprise/components/admin/ui-kit/CloseConfirmationDialog";
import { SaveButton } from "@ext/enterprise/components/admin/ui-kit/SaveButton";
import { SheetComponent } from "@ext/enterprise/components/admin/ui-kit/SheetComponent";
import { TableInfoBlock } from "@ext/enterprise/components/admin/ui-kit/table/TableInfoBlock";
import t from "@ext/localization/locale/translate";
import { zodResolver } from "@hookform/resolvers/zod";
import { AsyncSearchSelect, type LoadOptionsParams, type LoadOptionsResult } from "@ui-kit/AsyncSearchSelect";
import { Counter } from "@ui-kit/Counter";
import { getCoreRowModel, getFilteredRowModel, useReactTable } from "@ui-kit/DataTable";
import { Description } from "@ui-kit/Description";
import { Form, FormField, FormStack } from "@ui-kit/Form";
import { Input } from "@ui-kit/Input";
import type { SearchSelectOption } from "@ui-kit/SearchSelect";
import { AutogrowTextarea } from "@ui-kit/Textarea";
import type React from "react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { DeleteSelectedButton } from "../../../../../ui-kit/DeleteSelectedButton";
import { DraggableTableComponent } from "../../../../../ui-kit/table/DraggableTableComponent";
import { TableToolbar } from "../../../../../ui-kit/table/TableToolbar";
import { TableToolbarTextInput } from "../../../../../ui-kit/table/TableToolbarTextInput";
import {
	getLabelByView,
	getViewByLabel,
	viewOptions,
	type WorkspaceFormData,
	WorkspaceView,
} from "../../../types/WorkspaceComponent";
import { catalogsTableColumns } from "../config/CatalogsTableConfig";
import type { Catalog } from "../types/CatalogTypes";
import { CatalogToolbarAddBtn } from "./CatalogToolbarAddBtn";

const createFormSchema = () =>
	z.object({
		key: z.string().min(1, t("enterprise.admin.workspace.sections.dialog.key-placeholder")),
		title: z.string().min(1, t("enterprise.admin.workspace.sections.dialog.name-placeholder")),
		icon: z.string().optional(),
		view: z
			.object({
				value: z.string(),
				label: z.string(),
			})
			.optional(),
		description: z.string().optional(),
	});

interface SectionCardProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	editingKey: string | null;
	form: WorkspaceFormData;
	setForm: React.Dispatch<React.SetStateAction<WorkspaceFormData>>;
	selectedCatalogs: string[];
	setSelectedCatalogs: React.Dispatch<React.SetStateAction<string[]>>;
	sectionResources: string[];
	onSave: (overrideForm?: WorkspaceFormData, overrideCatalogs?: string[]) => void;
	onClose: () => void;
}

export function SectionCard({
	open,
	onOpenChange,
	editingKey,
	form,
	setForm,
	selectedCatalogs,
	setSelectedCatalogs,
	sectionResources,
	onSave,
	onClose,
}: SectionCardProps) {
	const [rowSelection, setRowSelection] = useState({});

	const formSchema = createFormSchema();

	const rhfForm = useForm<z.infer<typeof formSchema>>({
		resolver: zodResolver(formSchema),
		defaultValues: {
			key: form.key,
			title: form.title,
			icon: form.icon,
			view: form.view && {
				value: getLabelByView(form.view),
				label: getLabelByView(form.view),
			},
			description: form.description,
		},
	});

	const loadViewOptions = useCallback(
		async ({ searchQuery }: LoadOptionsParams): Promise<LoadOptionsResult<SearchSelectOption>> => {
			const filteredOptions = Object.values(viewOptions)
				.filter((option) => option.toLowerCase().includes(searchQuery.toLowerCase()))
				.map((option) => ({
					value: option,
					label: option,
				}));

			return { options: filteredOptions };
		},
		[],
	);

	const [originalForm, setOriginalForm] = useState<WorkspaceFormData | null>(null);
	const [originalCatalogs, setOriginalCatalogs] = useState<string[]>([]);
	const [showConfirmDialog, setShowConfirmDialog] = useState(false);
	const [pendingClose, setPendingClose] = useState<(() => void) | null>(null);

	const tableData = useMemo(() => selectedCatalogs.map((catalog) => ({ id: catalog, catalog })), [selectedCatalogs]);

	const table = useReactTable({
		data: tableData,
		columns: catalogsTableColumns,
		getCoreRowModel: getCoreRowModel(),
		getFilteredRowModel: getFilteredRowModel(),
		onRowSelectionChange: setRowSelection,
		state: {
			rowSelection,
		},
	});

	// biome-ignore lint/correctness/useExhaustiveDependencies: delete button wont appear without this
	const selectedCount = useMemo(() => table.getFilteredSelectedRowModel().rows.length, [table, rowSelection]);

	const handleAddCatalogs = useCallback(
		(catalogs: string[]) => {
			const catalogsToAdd = catalogs.filter((catalog) => !selectedCatalogs.includes(catalog));
			if (catalogsToAdd.length) {
				setSelectedCatalogs([...selectedCatalogs, ...catalogsToAdd]);
			}
		},
		[selectedCatalogs, setSelectedCatalogs],
	);

	const handleDeleteSelected = useCallback(() => {
		const selectedRows = table.getFilteredSelectedRowModel().rows;
		const selectedCatalogIds = selectedRows.map((row) => row.original.catalog);
		const updatedCatalogs = selectedCatalogs.filter((catalog) => !selectedCatalogIds.includes(catalog));
		setSelectedCatalogs(updatedCatalogs);
		setRowSelection({});
	}, [selectedCatalogs, setSelectedCatalogs, table]);

	const handleFilterChange = useCallback(
		(value: string | null) => {
			table.getColumn("catalog")?.setFilterValue(value);
		},
		[table],
	);

	useEffect(() => {
		if (open && !originalForm) {
			setOriginalForm({ ...form });
			setOriginalCatalogs([...selectedCatalogs]);
		}
	}, [open, form, selectedCatalogs, originalForm]);

	useEffect(() => {
		if (open) {
			setRowSelection({});
			setShowConfirmDialog(false);
			setPendingClose(null);
		}
	}, [open]);

	useEffect(() => {
		rhfForm.reset({
			key: form.key,
			title: form.title,
			icon: form.icon,
			view: form.view && {
				value: getLabelByView(form.view),
				label: getLabelByView(form.view),
			},
			description: form.description,
		});
	}, [form, rhfForm]);

	const onSubmit = (values: z.infer<typeof formSchema>) => {
		const updatedForm: WorkspaceFormData = {
			key: values.key,
			title: values.title,
			icon: values.icon || "",
			view: values.view ? getViewByLabel(values.view.value) || WorkspaceView.FOLDER : WorkspaceView.FOLDER,
			description: values.description || "",
			catalogs: selectedCatalogs,
		};
		setForm(updatedForm);
		onSave(updatedForm, selectedCatalogs);
	};

	const hasChanges = useMemo(() => {
		if (!originalForm) return false;

		const formChanged = JSON.stringify(form) !== JSON.stringify(originalForm);
		const catalogsChanged =
			selectedCatalogs.length !== originalCatalogs.length ||
			selectedCatalogs.some((v, i) => v !== originalCatalogs[i]);

		return formChanged || catalogsChanged;
	}, [form, selectedCatalogs, originalForm, originalCatalogs]);

	const handleCloseAttempt = useCallback(
		(closeCallback: () => void) => {
			if (hasChanges) {
				setShowConfirmDialog(true);
				setPendingClose(() => closeCallback);
			} else {
				closeCallback();
			}
		},
		[hasChanges],
	);

	const handleSheetClose = useCallback(
		(isOpen: boolean) => {
			if (!isOpen) {
				handleCloseAttempt(() => onOpenChange(false));
			} else {
				onOpenChange(true);
			}
		},
		[onOpenChange, handleCloseAttempt],
	);

	const finishClose = useCallback(() => {
		if (pendingClose) {
			pendingClose();
			setPendingClose(null);
		}
		setOriginalForm(null);
		setOriginalCatalogs([]);
	}, [pendingClose]);

	return (
		<>
			<SheetComponent
				cancelButton={<CancelButton onClick={onClose} />}
				confirmButton={<SaveButton onClick={rhfForm.handleSubmit(onSubmit)} />}
				isOpen={open}
				onOpenChange={handleSheetClose}
				sheetContent={
					<Form asChild {...rhfForm}>
						<form className="contents">
							<FormStack>
								<FormField
									control={({ field }) => (
										<Input
											placeholder={t(
												"enterprise.admin.workspace.sections.dialog.key-placeholder",
											)}
											{...field}
										/>
									)}
									layout="vertical"
									name="key"
									required
									title={t("enterprise.admin.workspace.sections.dialog.key")}
								/>

								<FormField
									control={({ field }) => (
										<Input
											placeholder={t(
												"enterprise.admin.workspace.sections.dialog.name-placeholder",
											)}
											{...field}
										/>
									)}
									layout="vertical"
									name="title"
									required
									title={t("name")}
								/>

								<FormField
									control={({ field }) => (
										<div className="flex items-center gap-2">
											<Input
												className="flex-1"
												placeholder="folder-open, settings, user-check"
												{...field}
											/>
										</div>
									)}
									description={t("enterprise.admin.workspace.sections.dialog.icon-description")}
									layout="vertical"
									name="icon"
									title={t("icon")}
								/>

								<FormField
									control={({ field }) => (
										<AsyncSearchSelect
											emptyText={t("enterprise.admin.workspace.sections.dialog.view-empty")}
											loadOptions={loadViewOptions}
											onChange={(option: SearchSelectOption | null) => {
												field.onChange(option);
												setForm({
													...form,
													view:
														getViewByLabel(String(option?.value || "")) ||
														WorkspaceView.FOLDER,
												});
											}}
											placeholder={t(
												"enterprise.admin.workspace.sections.dialog.view-placeholder",
											)}
											searchPlaceholder={t("enterprise.admin.search")}
											value={field.value || undefined}
										/>
									)}
									layout="vertical"
									name="view"
									title={t("enterprise.admin.workspace.sections.dialog.view")}
								/>

								<FormField
									control={({ field }) => (
										<AutogrowTextarea
											placeholder={t(
												"enterprise.admin.workspace.sections.dialog.description-placeholder",
											)}
											{...field}
										/>
									)}
									layout="vertical"
									name="description"
									title={t("description")}
								/>

								<div>
									<TableInfoBlock
										description={
											<Counter className="font-medium" size="md" variant="text">
												{selectedCatalogs.length}
											</Counter>
										}
										descriptionClassName="text-sm"
										title={t("enterprise.admin.workspace.sections.dialog.catalogs")}
										titleClassName="text-sm"
									/>

									<Description>
										{t("enterprise.admin.workspace.sections.dialog.catalogs-description")}
									</Description>

									<div>
										<TableToolbar
											input={
												<TableToolbarTextInput
													onChange={handleFilterChange}
													placeholder={t("enterprise.admin.search")}
													value={
														(table.getColumn("catalog")?.getFilterValue() as string) ?? ""
													}
												/>
											}
										>
											<DeleteSelectedButton
												count={selectedCount}
												onClick={handleDeleteSelected}
											/>

											<CatalogToolbarAddBtn
												catalogs={sectionResources}
												existingCatalogs={selectedCatalogs}
												onAdd={handleAddCatalogs}
											/>
										</TableToolbar>

										<DraggableTableComponent<Catalog>
											columns={catalogsTableColumns}
											onDragChange={setSelectedCatalogs}
											rowKey="id"
											table={table}
										/>
									</div>
								</div>
							</FormStack>
						</form>
					</Form>
				}
				title={
					editingKey
						? t("enterprise.admin.workspace.sections.dialog.edit-title")
						: t("enterprise.admin.workspace.sections.add")
				}
			/>

			<CloseConfirmationDialog
				isOpen={showConfirmDialog}
				onClose={finishClose}
				onOpenChange={setShowConfirmDialog}
			/>
		</>
	);
}
