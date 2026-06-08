import { useSettings } from "@ext/enterprise/components/admin/contexts/SettingsContext";
import { UnifiedMetricsTable } from "@ext/enterprise/components/admin/settings/metrics/common/UnifiedMetricsTable";
import type { SortOrder } from "@ext/enterprise/components/admin/settings/metrics/filters";
import t from "@ext/localization/locale/translate";
import { memo, useCallback, useMemo } from "react";
import {
	type ArticleRatingRow,
	type ArticleRatingSortByColumn,
	createArticleRatingsTableColumns,
} from "./ArticleRatingsTableConfig";

interface ArticleRatingsTableProps {
	startDate: string;
	endDate: string;
	sortBy: ArticleRatingSortByColumn;
	sortOrder: SortOrder;
	onSortChange: (tableKey: string) => (sortBy: string, sortOrder: SortOrder) => void;
	tableKey: string;
	selectedCatalogs?: string[];
}

const getRowId = (row: ArticleRatingRow, index: number) => `${row.catalogName}-${row.articleTitle}-${index}`;

const emptyInitialData = {
	rows: [] as ArticleRatingRow[],
	cursor: null,
	hasMore: true,
};

const ArticleRatingsTableInner = ({
	startDate,
	endDate,
	sortBy,
	sortOrder,
	onSortChange,
	tableKey,
	selectedCatalogs,
}: ArticleRatingsTableProps) => {
	const { getArticleRatings } = useSettings();

	const dataLoader = useCallback(
		async (cursor?: string, sortByParam?: string, sortOrderParam?: string, limit?: number) => {
			const catalogFilter = selectedCatalogs?.length ? selectedCatalogs : undefined;
			return getArticleRatings(
				startDate,
				endDate,
				cursor,
				sortByParam ?? sortBy,
				sortOrderParam ?? sortOrder,
				limit,
				catalogFilter,
			);
		},
		[getArticleRatings, startDate, endDate, sortBy, sortOrder, selectedCatalogs],
	);

	const dependencies = useMemo(
		() => [startDate, endDate, sortBy, sortOrder, (selectedCatalogs ?? []).join(",")],
		[startDate, endDate, sortBy, sortOrder, selectedCatalogs],
	);

	const actualSortHandler = useMemo(() => onSortChange(tableKey), [onSortChange, tableKey]);

	const sorting = useMemo(
		() => ({
			sortBy,
			sortOrder,
			onSortChange: actualSortHandler,
			createSortableColumns: createArticleRatingsTableColumns,
		}),
		[sortBy, sortOrder, actualSortHandler],
	);

	return (
		<UnifiedMetricsTable
			dataLoader={dataLoader}
			dependencies={dependencies}
			getRowId={getRowId}
			initialData={emptyInitialData}
			responsive={false}
			sorting={sorting}
			title={t("metrics.search.article-ratings-title")}
		/>
	);
};

const ArticleRatingsTable = memo(ArticleRatingsTableInner);

export default ArticleRatingsTable;
