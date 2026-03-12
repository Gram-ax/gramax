import { useSettings } from "@ext/enterprise/components/admin/contexts/SettingsContext";
import { FilterMultiSelect } from "@ext/enterprise/components/admin/settings/quiz/components/filters/QuizFilterMultiSelect";
import t from "@ext/localization/locale/translate";
import { Button } from "@ui-kit/Button";
import { useCache } from "@ui-kit/MultiSelect";
import { type Dispatch, memo, type SetStateAction, useCallback } from "react";
import { QuizFilterDropdown } from "./filters/QuizFilterDropdown";

interface TableControlProps {
	filters: QuizTableFilters;
	disabled: boolean;
	setFilters: Dispatch<SetStateAction<QuizTableFilters>>;
}

export type QuizTableFilters = {
	users: string[];
	tests: string[];
	result: string[];
};

interface MultiSelectFilterProps<T extends keyof QuizTableFilters> extends Omit<TableControlProps, "filters"> {
	filter: QuizTableFilters[T];
}

const TestsSelect = memo((props: MultiSelectFilterProps<"tests">) => {
	const { filter, setFilters, disabled } = props;
	const { searchQuizTests } = useSettings();

	const { loadOptions } = useCache(async (params) => {
		if (!searchQuizTests) return [];
		const tests = await searchQuizTests(params.searchQuery);
		const options = tests.map((test) => ({
			value: test.title.trim(),
			label: test.title.trim(),
		}));

		return options;
	});

	const onTestsChange = useCallback(
		(tests: string[]) => {
			setFilters((prev) => ({ ...prev, tests }));
		},
		[setFilters],
	);

	return (
		<FilterMultiSelect
			disabled={disabled}
			emptyPlaceholder={t("enterprise.admin.quiz.filters.tests.empty")}
			existingOptions={filter}
			icon="rows-3"
			loadingPlaceholder={t("enterprise.admin.quiz.filters.tests.loading")}
			loadOptions={loadOptions}
			onAdd={onTestsChange}
			onRemove={onTestsChange}
			searchPlaceholder={t("enterprise.admin.quiz.filters.tests.search")}
			trigger={t("enterprise.admin.quiz.filters.tests.name")}
		/>
	);
});

const UsersSelect = memo((props: MultiSelectFilterProps<"users">) => {
	const { filter, setFilters, disabled } = props;
	const { searchAnsweredUsers } = useSettings();

	const { loadOptions } = useCache(async (params) => {
		if (!searchAnsweredUsers) return [];
		const users = await searchAnsweredUsers(params.searchQuery);
		const options = users.map((user) => ({
			value: user.user_mail.trim(),
			label: user.user_mail.trim(),
		}));

		return options;
	});

	const onUsersChange = useCallback(
		(users: string[]) => {
			setFilters((prev) => ({ ...prev, users }));
		},
		[setFilters],
	);

	return (
		<FilterMultiSelect
			disabled={disabled}
			emptyPlaceholder={t("enterprise.admin.quiz.filters.users.empty")}
			existingOptions={filter}
			icon="users"
			loadingPlaceholder={t("enterprise.admin.quiz.filters.users.loading")}
			loadOptions={loadOptions}
			onAdd={onUsersChange}
			onRemove={onUsersChange}
			searchPlaceholder={t("enterprise.admin.quiz.filters.users.search")}
			trigger={t("enterprise.admin.quiz.filters.users.name")}
		/>
	);
});

const ResultSelect = memo((props: MultiSelectFilterProps<"result">) => {
	const { filter, setFilters, disabled } = props;

	const onResultChange = useCallback(
		(result: string[]) => {
			setFilters((prev) => ({ ...prev, result }));
		},
		[setFilters],
	);

	const onClear = useCallback(() => {
		setFilters((prev) => ({ ...prev, result: ["passed", "failed"] }));
	}, [setFilters]);

	return (
		<QuizFilterDropdown
			disabled={disabled}
			inverseCounter
			multiple
			onAdd={onResultChange}
			onClear={onClear}
			onRemove={onResultChange}
			options={[
				{ value: "passed", label: t("enterprise.admin.quiz.filters.result.passed") },
				{ value: "failed", label: t("enterprise.admin.quiz.filters.result.failed") },
			]}
			trigger={t("enterprise.admin.quiz.filters.result.name")}
			value={filter}
		/>
	);
});

export const TableControls = (props: TableControlProps) => {
	const { setFilters, filters, disabled } = props;

	const onClear = useCallback(() => {
		if (filters.users.length === 0 && filters.tests.length === 0 && filters.result.length === 0) return;
		setFilters({ users: [], tests: [], result: ["passed", "failed"] });
	}, [filters, setFilters]);

	return (
		<div className="flex gap-2">
			<UsersSelect disabled={disabled} filter={filters.users} setFilters={setFilters} />
			<TestsSelect disabled={disabled} filter={filters.tests} setFilters={setFilters} />
			<ResultSelect disabled={disabled} filter={filters.result} setFilters={setFilters} />
			<Button className="ml-auto" disabled={disabled} onClick={onClear} startIcon="eraser" variant="outline">
				{t("clear")}
			</Button>
		</div>
	);
};
