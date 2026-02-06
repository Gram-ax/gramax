import { useSettings } from "@ext/enterprise/components/admin/contexts/SettingsContext";
import { FilterMultiSelect } from "@ext/enterprise/components/admin/settings/quiz/components/filters/QuizFilterMultiSelect";
import t from "@ext/localization/locale/translate";
import { Button } from "@ui-kit/Button";
import { useCache } from "@ui-kit/MultiSelect";
import { Dispatch, memo, SetStateAction, useCallback } from "react";

interface TableControlProps {
	filters: QuizTableFilters;
	disabled: boolean;
	setFilters: Dispatch<SetStateAction<QuizTableFilters>>;
}

export type QuizTableFilters = {
	users: string[];
	tests: string[];
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

	const onTestsChange = useCallback((tests: string[]) => {
		setFilters((prev) => ({ ...prev, tests }));
	}, []);

	return (
		<FilterMultiSelect
			disabled={disabled}
			emptyPlaceholder={t("enterprise.admin.quiz.filters.tests.empty")}
			existingOptions={filter}
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

	const onUsersChange = useCallback((users: string[]) => {
		setFilters((prev) => ({ ...prev, users }));
	}, []);

	return (
		<FilterMultiSelect
			disabled={disabled}
			emptyPlaceholder={t("enterprise.admin.quiz.filters.users.empty")}
			existingOptions={filter}
			loadingPlaceholder={t("enterprise.admin.quiz.filters.users.loading")}
			loadOptions={loadOptions}
			onAdd={onUsersChange}
			onRemove={onUsersChange}
			searchPlaceholder={t("enterprise.admin.quiz.filters.users.search")}
			trigger={t("enterprise.admin.quiz.filters.users.name")}
		/>
	);
});

export const TableControls = (props: TableControlProps) => {
	const { setFilters, filters, disabled } = props;

	return (
		<div className="flex gap-2">
			<UsersSelect disabled={disabled} filter={filters.users} setFilters={setFilters} />
			<TestsSelect disabled={disabled} filter={filters.tests} setFilters={setFilters} />
			<Button
				className="ml-auto"
				disabled={disabled}
				onClick={() => setFilters({ users: [], tests: [] })}
				startIcon="eraser"
				variant="outline"
			>
				{t("clear")}
			</Button>
		</div>
	);
};
