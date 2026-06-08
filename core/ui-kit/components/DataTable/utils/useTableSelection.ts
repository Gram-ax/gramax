import type { Table } from "ics-ui-kit/vendors/tanstack/react-table";
import { useCallback } from "react";

/**
 * Хук для работы с выделением строк в таблицах, где есть отключенные (disabled) записи.
 *
 * @example
 * ```typescript
 * // Базовое использование
 * const { allSelectableSelected, someSelectableSelected, handleSelectAll, getSelectedCount } = useTableSelection({ table });
 *
 * // В конфигурации колонок
 * header: ({ table }) => {
 *   const { allSelectableSelected, someSelectableSelected, handleSelectAll } = useTableSelection({ table });
 *   return (
 *     <Checkbox
 *       checked={allSelectableSelected || (someSelectableSelected && "indeterminate")}
 *       onCheckedChange={handleSelectAll}
 *     />
 *   );
 * }
 * ```
 *
 * @param table - экземпляр таблицы из useReactTable
 * @param isRowDisabled - функция для определения disabled строк (по умолчанию проверяет row.disabled)
 */
interface UseTableSelectionProps<T> {
	table: Table<T>;
	isRowDisabled?: (row: T) => boolean;
}

export const useTableSelection = <T extends { disabled?: boolean }>({
	table,
	isRowDisabled = (row) => row.disabled === true,
}: UseTableSelectionProps<T>) => {
	const getSelectableRows = useCallback(
		() => table.getRowModel().rows.filter((row) => !isRowDisabled(row.original)),
		[isRowDisabled, table],
	);

	const getSelectedSelectableRows = useCallback(
		() => getSelectableRows().filter((row) => row.getIsSelected()),
		[getSelectableRows],
	);

	const allSelectableSelected =
		getSelectableRows().length > 0 && getSelectedSelectableRows().length === getSelectableRows().length;

	const someSelectableSelected = getSelectedSelectableRows().length > 0;

	const handleSelectAll = (value: boolean) => {
		if (value) {
			getSelectableRows().forEach((row) => row.toggleSelected(true));
		} else {
			table.getRowModel().rows.forEach((row) => row.toggleSelected(false));
		}
	};

	const getSelectedCount = () => getSelectedSelectableRows().length;

	const getSelectedItems = useCallback(
		() => getSelectedSelectableRows().map((row) => row.original),
		[getSelectedSelectableRows],
	);

	return {
		/** true если все доступные строки выделены */
		allSelectableSelected,
		/** true если некоторые (но не все) доступные строки выделены */
		someSelectableSelected,
		/** Обработчик для чекбокса "выделить все" */
		handleSelectAll,
		/** Количество выделенных доступных строк */
		getSelectedCount,
		/** Массив выделенных объектов */
		getSelectedItems,
		/** Массив доступных для выделения строк */
		getSelectableRows,
	};
};
