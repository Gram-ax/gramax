import { SearchSelectOption, AsyncSearchSelect as UiKitAsyncSearchSelect } from "ics-ui-kit/components/search-select";
import { ExtractComponentGeneric } from "../../lib/extractComponentGeneric";
import { FC } from "react";
import { RenderOptionProps as UiKitRenderOptionProps } from "ics-ui-kit/components/search-select/async-search-select/types";
import t from "@ext/localization/locale/translate";

type UiKitAsyncSearchSelectProps = ExtractComponentGeneric<typeof UiKitAsyncSearchSelect>;

export type RenderOptionProps<T extends SearchSelectOption = SearchSelectOption> = UiKitRenderOptionProps & {
	option: T;
};

export type AsyncSearchSelectOption<T extends SearchSelectOption = SearchSelectOption> = T;

interface AsyncSearchSelectProps extends UiKitAsyncSearchSelectProps {}

export const AsyncSearchSelect: FC<AsyncSearchSelectProps> = (props) => {
	return <UiKitAsyncSearchSelect searchPlaceholder={t("find2")} {...props} />;
};
