import Date from "@components/Atoms/Date";
import useWatch from "@core-ui/hooks/useWatch";
import DateUtils from "@core-ui/utils/dateUtils";
import { useSettings } from "@ext/enterprise/components/admin/contexts/SettingsContext";
import {
	type QuizTableFilters,
	TableControls,
} from "@ext/enterprise/components/admin/settings/quiz/components/QuizTableControls";
import { TestInfo } from "@ext/enterprise/components/admin/settings/quiz/components/QuizTestInfo";
import {
	LazyInfinityTable,
	type RequestCursor,
	type RequestData,
} from "@ext/enterprise/components/admin/ui-kit/table/LazyInfinityTable/LazyInfinityTable";
import { TABLE_EDIT_COLUMN_CODE } from "@ext/enterprise/components/admin/ui-kit/table/TableComponent";
import t from "@ext/localization/locale/translate";
import { IconButton } from "@ui-kit/Button";
import { type ColumnDef, getCoreRowModel, getFilteredRowModel, useReactTable } from "@ui-kit/DataTable";
import { TextOverflowTooltip } from "@ui-kit/Tooltip";
import { useCallback, useEffect, useRef, useState } from "react";
import type { QuizTest } from "../types/QuizComponentTypes";

const columns: ColumnDef<QuizTest>[] = [
	{
		id: TABLE_EDIT_COLUMN_CODE,
		accessorKey: "id",
		header: "",
		enableHiding: false,
		cell: () => <IconButton className="h-auto p-0 align-middle" icon={"maximize-2"} size="md" variant="text" />,
	},
	{
		accessorKey: "user",
		header: () => t("enterprise.admin.quiz.users-test-table.user"),
		cell: ({ row }) => <TextOverflowTooltip className="align-middle">{row.original.user_mail}</TextOverflowTooltip>,
	},
	{
		accessorKey: "title",
		header: () => t("enterprise.admin.quiz.users-test-table.test"),
		cell: ({ row }) => (
			<TextOverflowTooltip className="align-middle">{row.original.test_title}</TextOverflowTooltip>
		),
	},
	{
		accessorKey: "version",
		header: () => t("enterprise.admin.quiz.users-test-table.version"),
		cell: ({ row }) => (
			<span>
				<TextOverflowTooltip className="align-middle cursor">
					{DateUtils.getDateViewModel(row.original.test_version_date)}
				</TextOverflowTooltip>
			</span>
		),
	},
	{
		accessorKey: "created_at",
		header: () => t("enterprise.admin.quiz.users-test-table.created-at"),
		cell: ({ row }) => <Date date={row.original.created_at} />,
	},
];

const PAGE_SIZE = 50;

export const QuizTestsTable = ({ isHealthy }: { isHealthy: boolean }) => {
	const { getQuizUsersAnswers } = useSettings();
	const [isOpen, setIsOpen] = useState(false);
	const [tests, setTests] = useState<QuizTest[]>([]);
	const [filters, setFilters] = useState<QuizTableFilters>({ users: [], tests: [] });
	const cursorRef = useRef<RequestCursor>(null);
	const hasMoreRef = useRef(true);

	const loadOptions = useCallback(async (): Promise<RequestData<QuizTest>> => {
		if (!isHealthy) return { data: [], has_more: false, next_cursor: null };
		const response = await getQuizUsersAnswers(cursorRef.current, PAGE_SIZE, filters);
		if (response.next_cursor) cursorRef.current = response.next_cursor;
		hasMoreRef.current = response.has_more;
		return response;
	}, [filters, isHealthy, getQuizUsersAnswers]);

	const table = useReactTable<QuizTest>({
		data: tests,
		columns,
		enableMultiRowSelection: false,
		getFilteredRowModel: getFilteredRowModel(),
		getCoreRowModel: getCoreRowModel(),
	});

	const selectedRow = table.getSelectedRowModel();
	useWatch(() => {
		setIsOpen(selectedRow.rows.length > 0);
	}, [selectedRow.rows]);

	const onClose = useCallback(() => {
		table.resetRowSelection();
	}, [table]);

	useWatch(() => {
		cursorRef.current = null;
		hasMoreRef.current = true;
	}, [filters]);

	useEffect(() => {
		return () => {
			cursorRef.current = null;
			hasMoreRef.current = false;
		};
	}, []);

	return (
		<div className="flex gap-4 h-full max-h-full">
			<div className="flex flex-col flex-1 min-h-0 max-h-full gap-2 overflow-hidden">
				<TableControls disabled={!isHealthy} filters={filters} setFilters={setFilters} />
				<div className="flex-1 min-h-0 max-h-full">
					<LazyInfinityTable<QuizTest>
						columns={columns}
						deps={[filters, isHealthy]}
						hasMore={hasMoreRef.current}
						loadOptions={loadOptions}
						onRowClick={(row) => row.toggleSelected()}
						setData={setTests}
						table={table}
					/>
				</div>
			</div>
			<TestInfo isOpen={isOpen} onClose={onClose} table={table} />
		</div>
	);
};
