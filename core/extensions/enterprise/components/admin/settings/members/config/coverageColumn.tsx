import t from "@ext/localization/locale/translate";
import type { ColumnDef } from "@ui-kit/DataTable";
import { Tooltip, TooltipContent, TooltipTrigger } from "@ui-kit/Tooltip";

const MAX_NAMES = 5;

export interface CoverageColumnOptions<T> {
	getCoverage: (row: T) => number;
	getTotal: (row: T) => number;
	getNames: (row: T) => string[];
}

export const coverageColumn = <T,>(opts: CoverageColumnOptions<T>): ColumnDef<T> => ({
	id: "coverage",
	header: t("enterprise.admin.coverage.title"),
	cell: ({ row }) => {
		const item = row.original;

		return (
			<CoverageCell coverage={opts.getCoverage(item)} names={opts.getNames(item)} total={opts.getTotal(item)} />
		);
	},
});

interface CoverageCellProps {
	coverage: number;
	total: number;
	names: string[];
}

const CoverageCell = ({ coverage, total, names }: CoverageCellProps) => {
	const shown = names.slice(0, MAX_NAMES);
	const rest = names.length - shown.length;

	return (
		<div className="flex items-center gap-2">
			<Tooltip>
				<TooltipTrigger asChild>
					<span className="text-sm text-muted underline decoration-dotted">{`${coverage}/${total}`}</span>
				</TooltipTrigger>
				<TooltipContent className="font-sans font-normal">
					<div className="flex flex-col gap-0.5">
						<span className="font-medium">{t("enterprise.admin.coverage.included-in")}</span>
						{shown.map((name) => (
							<span key={name}>{name}</span>
						))}
						{rest > 0 && <span>...</span>}
					</div>
				</TooltipContent>
			</Tooltip>
		</div>
	);
};
