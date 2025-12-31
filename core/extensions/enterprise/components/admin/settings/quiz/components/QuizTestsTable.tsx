import { TABLE_EDIT_COLUMN_CODE } from "@ext/enterprise/components/admin/ui-kit/table/TableComponent";
import { ColumnDef, getCoreRowModel, getFilteredRowModel, useReactTable } from "@ui-kit/DataTable";
import { QuizTest } from "../types/QuizComponentTypes";
import Date from "@components/Atoms/Date";
import { useCallback, useEffect, useRef, useState } from "react";
import { useSettings } from "@ext/enterprise/components/admin/contexts/SettingsContext";
import useWatch from "@core-ui/hooks/useWatch";
import { IconButton } from "@ui-kit/Button";
import t from "@ext/localization/locale/translate";
import { TestInfo } from "@ext/enterprise/components/admin/settings/quiz/components/QuizTestInfo";
import {
	QuizTableFilters,
	TableControls,
} from "@ext/enterprise/components/admin/settings/quiz/components/QuizTableControls";
import { TextOverflowTooltip } from "@ui-kit/Tooltip";
import DateUtils from "@core-ui/utils/dateUtils";
import {
	LazyInfinityTable,
	RequestCursor,
	RequestData,
} from "@ext/enterprise/components/admin/ui-kit/table/LazyInfinityTable/LazyInfinityTable";

const columns: ColumnDef<QuizTest>[] = [
	{
		id: TABLE_EDIT_COLUMN_CODE,
		accessorKey: "id",
		header: "",
		enableHiding: false,
		cell: () => <IconButton icon={"maximize-2"} size="md" className="h-auto p-0 align-middle" variant="text" />,
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

const PAGE_SIZE = 10;

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
	}, [filters, isHealthy]);

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
				<TableControls filters={filters} setFilters={setFilters} disabled={!isHealthy} />
				<div className="flex-1 min-h-0 max-h-full">
					<LazyInfinityTable<QuizTest>
						table={table}
						setData={setTests}
						columns={columns}
						hasMore={hasMoreRef.current}
						deps={[filters, isHealthy]}
						loadOptions={loadOptions}
						onRowClick={(row) => row.toggleSelected()}
					/>
				</div>
			</div>
			<TestInfo table={table} isOpen={isOpen} onClose={onClose} />
		</div>
	);
};
