import t from "@ext/localization/locale/translate";
import {
	type MultiSelectProps,
	type SearchSelectOption,
	MultiSelect as UiKitMultiSelect,
} from "ics-ui-kit/components/search-select";

export const MultiSelect = <T extends SearchSelectOption = SearchSelectOption>(props: MultiSelectProps<T>) => (
	<UiKitMultiSelect
		emptyText={t("multiSelect.empty")}
		errorText={t("multiSelect.error")}
		inputHintText={t("multiSelect.inputHint")}
		loadingText={t("multiSelect.loading")}
		placeholder={t("multiSelect.placeholder")}
		searchPlaceholder={t("multiSelect.search")}
		{...props}
	/>
);
