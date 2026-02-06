import styled from "@emotion/styled";
import { SheetComponent } from "@ext/enterprise/components/admin/ui-kit/SheetComponent";
import { TableInfoBlock } from "@ext/enterprise/components/admin/ui-kit/table/TableInfoBlock";
import { zodResolver } from "@hookform/resolvers/zod";
import {
	AlertDialog,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogPrimitiveAction,
	AlertDialogPrimitiveCancel,
	AlertDialogTitle,
} from "@ui-kit/AlertDialog";
import { AsyncSearchSelect, LoadOptionsParams, LoadOptionsResult } from "@ui-kit/AsyncSearchSelect";
import { Button } from "@ui-kit/Button";
import { getCoreRowModel, getFilteredRowModel, useReactTable } from "@ui-kit/DataTable";
import { Description } from "@ui-kit/Description";
import { Form, FormField, FormStack } from "@ui-kit/Form";
import { Input } from "@ui-kit/Input";
import type { SearchSelectOption } from "@ui-kit/SearchSelect";
import { AutogrowTextarea } from "@ui-kit/Textarea";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { AlertDeleteDialog } from "../../../../../ui-kit/AlertDeleteDialog";
import { DraggableTableComponent } from "../../../../../ui-kit/table/DraggableTableComponent";
import { TableToolbar } from "../../../../../ui-kit/table/TableToolbar";
import { TableToolbarTextInput } from "../../../../../ui-kit/table/TableToolbarTextInput";
import {
	getLabelByView,
	getViewByLabel,
	viewOptions,
	WorkspaceFormData,
	WorkspaceView,
} from "../../../types/WorkspaceComponent";
import { catalogsTableColumns } from "../config/CatalogsTableConfig";
import { Catalog } from "../types/CatalogTypes";
import { CatalogToolbarAddBtn } from "./CatalogToolbarAddBtn";

const StyledAlertDialogContent = styled(AlertDialogContent)`
	max-width: 36rem;
`;

const StyledAlertDialogFooter = styled(AlertDialogFooter)`
	display: flex;
	flex-direction: column;
	gap: 0.5rem;

	@media (min-width: 768px) {
		flex-direction: row;
		gap: 0.5rem;
		justify-content: space-between;
	}
`;

const StyledAlertDialogCancel = styled(AlertDialogCancel)`
	@media (min-width: 768px) {
		width: auto;
	}
	white-space: normal;
	text-align: center;
	min-width: 0;
`;

const ButtonContainer = styled.div`
	display: flex;
	flex-direction: column;
	gap: 0.5rem;

	@media (min-width: 768px) {
		flex-direction: row;
		gap: 0.5rem;
		flex-wrap: wrap;
	}
`;

const createFormSchema = () =>
	z.object({
		key: z.string().min(1, "Введите ключ"),
		title: z.string().min(1, "Введите название"),
		icon: z.string().optional(),
		view: z
			.object({
				value: z.string(),
				label: z.string(),
			})
			.optional(),
		description: z.string().optional(),
	});

interface SectionDialogProps {
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

export function SectionDialog({
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
}: SectionDialogProps) {
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

	const [originalForm, setOriginalForm] = useState<any>(null);
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

	const handleConfirmClose = useCallback(() => {
		setShowConfirmDialog(false);
		if (pendingClose) {
			pendingClose();
			setPendingClose(null);
		}
		setOriginalForm(null);
		setOriginalCatalogs([]);
	}, [pendingClose]);

	const handleApplyAndClose = useCallback(() => {
		setShowConfirmDialog(false);
		onSave(form, selectedCatalogs);
		if (pendingClose) {
			pendingClose();
			setPendingClose(null);
		}
		setOriginalForm(null);
		setOriginalCatalogs([]);
	}, [onSave, pendingClose, form, selectedCatalogs]);

	const handleCancelClose = useCallback(() => {
		setShowConfirmDialog(false);
		setPendingClose(null);
	}, []);

	return (
		<>
			<SheetComponent
				cancelButton={
					<Button onClick={onClose} variant="outline">
						Отмена
					</Button>
				}
				confirmButton={
					<Button onClick={rhfForm.handleSubmit(onSubmit)}>{editingKey ? "Ок" : "Добавить"}</Button>
				}
				isOpen={open}
				onOpenChange={handleSheetClose}
				sheetContent={
					<Form asChild {...rhfForm}>
						<form className="contents">
							<FormStack>
								<FormField
									control={({ field }) => <Input placeholder="Введите ключ" {...field} />}
									layout="vertical"
									name="key"
									required
									title="Ключ"
								/>

								<FormField
									control={({ field }) => <Input placeholder="Введите название" {...field} />}
									layout="vertical"
									name="title"
									required
									title="Название"
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
									description="Введите название иконки Lucide в kebab-case формате (например: folder-open, settings, user-check)"
									layout="vertical"
									name="icon"
									title="Иконка"
								/>

								<FormField
									control={({ field }) => (
										<AsyncSearchSelect
											emptyText="Виды не найдены"
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
											placeholder="Выберите отображение"
											searchPlaceholder="Поиск вида..."
											value={field.value || undefined}
										/>
									)}
									layout="vertical"
									name="view"
									title="Вид"
								/>

								<FormField
									control={({ field }) => (
										<AutogrowTextarea placeholder="Введите описание секции" {...field} />
									)}
									layout="vertical"
									name="description"
									title="Описание"
								/>

								<div>
									<TableInfoBlock
										description={selectedCatalogs.length}
										descriptionClassName="text-sm"
										title="Каталоги"
										titleClassName="text-sm"
									/>

									<Description>Добавляйте каталоги и настраивайте их порядок в секции</Description>

									<div>
										<TableToolbar
											input={
												<TableToolbarTextInput
													onChange={handleFilterChange}
													placeholder="Найти каталог..."
													value={
														(table.getColumn("catalog")?.getFilterValue() as string) ?? ""
													}
												/>
											}
										>
											<AlertDeleteDialog
												hidden={!selectedCount}
												onConfirm={handleDeleteSelected}
												selectedCount={selectedCount}
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
				title={editingKey ? "Редактировать секцию" : "Добавить секцию"}
			/>

			<AlertDialog onOpenChange={setShowConfirmDialog} open={showConfirmDialog}>
				<StyledAlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>У вас есть несохраненные изменения</AlertDialogTitle>
						<AlertDialogDescription>
							Вы внесли изменения в секцию, но не применили их. Применение изменений не сохраняет
							конфигурацию.
						</AlertDialogDescription>
					</AlertDialogHeader>
					<StyledAlertDialogFooter>
						<StyledAlertDialogCancel onClick={handleCancelClose}>Вернуться</StyledAlertDialogCancel>

						<ButtonContainer>
							<AlertDialogPrimitiveCancel asChild>
								<Button onClick={handleConfirmClose} status="error">
									Закрыть без применения
								</Button>
							</AlertDialogPrimitiveCancel>
							<AlertDialogPrimitiveAction asChild>
								<Button onClick={handleApplyAndClose}>Применить изменения</Button>
							</AlertDialogPrimitiveAction>
						</ButtonContainer>
					</StyledAlertDialogFooter>
				</StyledAlertDialogContent>
			</AlertDialog>
		</>
	);
}
