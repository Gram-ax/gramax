import { WithTooltip } from "@ext/enterprise/components/admin/ui-kit/WithTooltip";
import t from "@ext/localization/locale/translate";
import type { ColumnDef } from "@ui-kit/DataTable";
import { ErrorState } from "@ui-kit/ErrorState";
import { MultiSelect } from "@ui-kit/MultiSelect";
import { useCallback, useMemo } from "react";

export interface BranchesColumnOptions<T> {
	getValue?: (row: T) => string[];
	showPicker?: (row: T) => boolean | "disabled";
	onChange?: (row: T, branches: string[]) => void;
	loadBranches?: (row: T) => Promise<string[]>;
	getError?: (row: T) => string | undefined;
}

export const branchesColumn = <T,>(args: BranchesColumnOptions<T>): ColumnDef<T> => {
	const { getValue, onChange, getError, loadBranches, showPicker } = args;
	return {
		id: "branches",
		header: t("branches"),
		size: 224,
		enableSorting: false,
		cell: ({ row }) => {
			const item = row.original;
			const show = showPicker?.(item);
			if (show === false || !getValue || !loadBranches || !onChange) return <AllBranches />;
			if (show === "disabled")
				return (
					<WithTooltip tooltip={t("enterprise.admin.not-available-in-bulk")}>
						<UnavailableBranches />
					</WithTooltip>
				);
			const values = getValue(item) ?? [];

			return (
				<BranchMultiSelect
					error={getError?.(item)}
					loadBranches={() => loadBranches(item)}
					onChange={(branches) => onChange(item, branches)}
					value={values}
				/>
			);
		},
	};
};

const AllBranches = () => <MutedText text={t("enterprise.admin.all")} />;
const UnavailableBranches = () => <MutedText text={t("enterprise.admin.unavailable")} />;
const MutedText = ({ text }: { text: string }) => <span className="text-sm text-muted-foreground">{text}</span>;

interface BranchMultiSelectProps {
	value: string[];
	onChange: (branches: string[]) => void;
	loadBranches: () => Promise<string[]>;
	error?: string;
}

const BranchMultiSelect = ({ value, onChange, loadBranches, error }: BranchMultiSelectProps) => {
	const selectValue = useMemo(() => value.map((b) => ({ value: b, label: b })), [value]);

	const handleChange = useCallback(
		(opts: { value: string; label: string }[]) => onChange(opts.map((o) => String(o.value))),
		[onChange],
	);

	const handleLoadOptions = useCallback(
		async ({ searchQuery }: { searchQuery: string }) => {
			const list = await loadBranches();
			return {
				options: list
					.filter((b) => b.toLowerCase().includes(searchQuery.toLowerCase()))
					.map((b) => ({ value: b, label: b })),
			};
		},
		[loadBranches],
	);

	return (
		<div className="flex flex-col gap-1">
			<MultiSelect
				className="[&>button>div]:pl-0"
				invalid={Boolean(error)}
				loadMode="auto"
				loadOptions={handleLoadOptions}
				minInputLength={1}
				onChange={handleChange}
				placeholder={t("enterprise.admin.resources.branches.placeholder")}
				searchPlaceholder={t("enterprise.admin.search")}
				value={selectValue}
			/>
			{error && <ErrorState className="text-xs p-0 justify-start">{error}</ErrorState>}
		</div>
	);
};
