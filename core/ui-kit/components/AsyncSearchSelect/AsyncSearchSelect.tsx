import t from "@ext/localization/locale/translate";
import { SearchSelectOption, AsyncSearchSelect as UiKitAsyncSearchSelect } from "ics-ui-kit/components/search-select";
import { RenderOptionProps as UiKitRenderOptionProps } from "ics-ui-kit/components/search-select/async-search-select/types";
import { FC } from "react";
import { ExtractComponentGeneric } from "../../lib/extractComponentGeneric";

type UiKitAsyncSearchSelectProps = ExtractComponentGeneric<typeof UiKitAsyncSearchSelect>;

export type RenderOptionProps<T extends SearchSelectOption = SearchSelectOption> = UiKitRenderOptionProps & {
	option: T;
};

export type AsyncSearchSelectOption<T extends SearchSelectOption = SearchSelectOption> = T;

interface AsyncSearchSelectProps extends UiKitAsyncSearchSelectProps {}

export const AsyncSearchSelect: FC<AsyncSearchSelectProps> = (props) => {
	return <UiKitAsyncSearchSelect searchPlaceholder={t("find2")} {...props} />;
};
