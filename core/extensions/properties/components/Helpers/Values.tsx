import { Table, TableBody, TableCell, TableRow } from "@ui-kit/Table";
import { IconButton } from "@ui-kit/Button";
import { ColumnDef, flexRender, getCoreRowModel, Row, useReactTable } from "@ui-kit/DataTable";
import {
	closestCenter,
	DndContext,
	DragEndEvent,
	KeyboardSensor,
	MouseSensor,
	TouchSensor,
	useSensor,
	useSensors,
} from "@dnd-kit/core";
import { restrictToVerticalAxis } from "@dnd-kit/modifiers";
import { arrayMove, SortableContext, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { CSSProperties, useCallback, useEffect, useMemo, useState } from "react";
import t from "@ext/localization/locale/translate";
import Input from "@components/Atoms/Input";
import { Tooltip, TooltipTrigger, TooltipContent } from "@ui-kit/Tooltip";
import { EmptyState } from "@ui-kit/EmptyState";

interface ValuesProps {
	data: string[];
	onChange: (data: string[]) => void;
}

interface DraggableTableRowProps {
	row: Row<string>;
	children: React.ReactNode;
	state?: string | false;
}

const DraggableTableRow = ({ row, children, state }: DraggableTableRowProps) => {
	const { transform, transition, setNodeRef, isDragging } = useSortable({
		id: row.original,
	});

	const style: CSSProperties = {
		transform: CSS.Transform.toString(transform),
		transition: transition,
		opacity: isDragging ? 0.8 : 1,
		zIndex: isDragging ? 1 : 0,
		position: "relative",
	};

	return (
		<TableRow ref={setNodeRef} style={style} data-state={state} className="border-secondary-border">
			{children}
		</TableRow>
	);
};

const DraggableButton = ({ rowId }: { rowId: string }) => {
	const { attributes, listeners, setNodeRef } = useSortable({
		id: rowId,
	});

	return (
		<div {...listeners} {...attributes} ref={setNodeRef} className="flex items-center justify-center ml-1">
			<IconButton
				type="button"
				variant="text"
				size="sm"
				style={{ padding: "0", height: "auto" }}
				icon="grip-vertical"
			/>
		</div>
	);
};

const DeleteButton = ({ onClick }: { onClick: () => void }) => {
	return (
		<Tooltip>
			<TooltipContent>{t("delete")}</TooltipContent>
			<TooltipTrigger asChild>
				<div className="flex items-center justify-center mr-2">
					<IconButton
						type="button"
						variant="text"
						size="sm"
						icon="trash"
						style={{ padding: "0", height: "auto" }}
						onClick={onClick}
					/>
				</div>
			</TooltipTrigger>
		</Tooltip>
	);
};

export const Values = ({ data: initialData, onChange }: ValuesProps) => {
	const [data, setData] = useState(initialData);

	useEffect(() => {
		setData(initialData);
	}, [initialData]);

	const deleteRow = useCallback(
		(value: string) => {
			setData((prevData) => {
				const newData = prevData.filter((v) => v !== value);
				onChange(newData);
				return newData;
			});
		},
		[onChange],
	);

	const updateRow = useCallback(
		(value: string, newValue: string) => {
			setData((prevData) => {
				const newData = prevData.map((v) => (v === value ? newValue : v));
				onChange(newData);
				return newData;
			});
		},
		[onChange],
	);

	const onBlur = useCallback(
		(e: React.FocusEvent<HTMLInputElement>, initialValue: string) => {
			const value = e.target.value;
			if (!value.trim().length) return deleteRow(value);
			updateRow(initialValue, value);
		},
		[deleteRow, updateRow],
	);

	const columns: ColumnDef<string>[] = useMemo(
		() => [
			{
				id: "draggable",
				enableSorting: false,
				enableHiding: false,
				cell: ({ row }) => <DraggableButton rowId={row.original} />,
			},
			{
				accessorKey: "value",
				header: "Название",
				cell: ({ row }) => (
					<Input
						className="text-primary-fg"
						autoFocus={!row.original.length}
						defaultValue={row.original}
						onBlur={(e) => onBlur(e, row.original)}
					/>
				),
			},
			{
				accessorKey: "actions",
				header: "",
				cell: ({ row }) => <DeleteButton onClick={() => deleteRow(row.original)} />,
			},
		],
		[],
	);

	const table = useReactTable({
		data,
		columns,
		getCoreRowModel: getCoreRowModel(),
		getRowId: (row) => row,
	});

	const sensors = useSensors(
		useSensor(MouseSensor, {
			activationConstraint: {
				distance: 10,
			},
		}),
		useSensor(TouchSensor, {
			activationConstraint: {
				delay: 300,
				tolerance: 5,
			},
		}),
		useSensor(KeyboardSensor, {}),
	);

	const handleDragEnd = useCallback(
		(event: DragEndEvent) => {
			const { active, over } = event;
			if (active && over && active.id !== over.id) {
				setData((data) => {
					const oldIndex = data.indexOf(active.id as string);
					const newIndex = data.indexOf(over.id as string);

					const newData = arrayMove(data, oldIndex, newIndex);
					onChange(newData);
					return newData;
				});
			}
		},
		[onChange],
	);

	return (
		<DndContext
			sensors={sensors}
			collisionDetection={closestCenter}
			modifiers={[restrictToVerticalAxis]}
			onDragEnd={handleDragEnd}
		>
			<div className="overflow-hidden rounded-md border border-secondary-border">
				<Table>
					<SortableContext items={data} strategy={verticalListSortingStrategy}>
						<TableBody>
							{table.getRowModel().rows?.length ? (
								table.getRowModel().rows.map((row) => (
									<DraggableTableRow
										key={row.original}
										row={row}
										state={row.getIsSelected() && "selected"}
									>
										{row.getVisibleCells().map((cell) => (
											<TableCell
												key={cell.id}
												className={
													cell.column.id === "actions" || cell.column.id === "draggable"
														? "w-6 border-secondary-border"
														: "auto border-secondary-border"
												}
											>
												{flexRender(cell.column.columnDef.cell, cell.getContext())}
											</TableCell>
										))}
									</DraggableTableRow>
								))
							) : (
								<TableRow>
									<TableCell
										colSpan={columns.length}
										className="h-24 text-center border-secondary-border"
									>
										<EmptyState>{t("properties.no-values")}</EmptyState>
									</TableCell>
								</TableRow>
							)}
						</TableBody>
					</SortableContext>
				</Table>
			</div>
		</DndContext>
	);
};
