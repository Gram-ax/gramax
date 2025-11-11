import { useSettings } from "@ext/enterprise/components/admin/contexts/SettingsContext";
import { FilterMultiSelect } from "@ext/enterprise/components/admin/settings/quiz/components/filters/QuizFilterMultiSelect";
import t from "@ext/localization/locale/translate";
import { Button } from "@ui-kit/Button";
import { useCache } from "@ui-kit/MultiSelect";
import { Dispatch, memo, SetStateAction, useCallback } from "react";

interface TableControlProps {
	setFilters: Dispatch<SetStateAction<QuizTableFilters>>;
	filters: QuizTableFilters;
}

export type QuizTableFilters = {
	users: string[];
	tests: string[];
};

interface MultiSelectFilterProps<T extends keyof QuizTableFilters> extends Omit<TableControlProps, "filters"> {
	filter: QuizTableFilters[T];
}

const TestsSelect = memo((props: MultiSelectFilterProps<"tests">) => {
	const { filter, setFilters } = props;
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
			existingOptions={filter}
			onAdd={onTestsChange}
			onRemove={onTestsChange}
			loadOptions={loadOptions}
			trigger={t("enterprise.admin.quiz.filters.tests.name")}
			searchPlaceholder={t("enterprise.admin.quiz.filters.tests.search")}
			loadingPlaceholder={t("enterprise.admin.quiz.filters.tests.loading")}
			emptyPlaceholder={t("enterprise.admin.quiz.filters.tests.empty")}
		/>
	);
});

const UsersSelect = memo((props: MultiSelectFilterProps<"users">) => {
	const { filter, setFilters } = props;
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
			existingOptions={filter}
			onAdd={onUsersChange}
			onRemove={onUsersChange}
			loadOptions={loadOptions}
			trigger={t("enterprise.admin.quiz.filters.users.name")}
			searchPlaceholder={t("enterprise.admin.quiz.filters.users.search")}
			loadingPlaceholder={t("enterprise.admin.quiz.filters.users.loading")}
			emptyPlaceholder={t("enterprise.admin.quiz.filters.users.empty")}
		/>
	);
});

export const TableControls = (props: TableControlProps) => {
	const { setFilters, filters } = props;

	return (
		<div className="flex gap-2">
			<UsersSelect filter={filters.users} setFilters={setFilters} />
			<TestsSelect filter={filters.tests} setFilters={setFilters} />
			<Button
				variant="outline"
				startIcon="eraser"
				className="ml-auto"
				onClick={() => setFilters({ users: [], tests: [] })}
			>
				{t("clear")}
			</Button>
		</div>
	);
};
