import t from "@ext/localization/locale/translate";
import {
	LazySearchSelect as UiKitLazySearchSelect,
	SearchSelectOption as UiKitLazySearchSelectOption,
} from "ics-ui-kit/components/search-select";
import { RenderOptionProps as UiKitRenderOptionProps } from "ics-ui-kit/components/search-select/async-search-select/types";
import { FC } from "react";
import { ExtractComponentGeneric } from "../../lib/extractComponentGeneric";

type UiKitLazySearchSelectProps = ExtractComponentGeneric<typeof UiKitLazySearchSelect>;

export type RenderOptionProps<T extends UiKitLazySearchSelectOption> = UiKitRenderOptionProps & {
	option: T;
};

export type LazySearchSelectOption<T extends UiKitLazySearchSelectOption> = T;

interface LazySearchSelectProps extends UiKitLazySearchSelectProps {
	emptyMessage?: JSX.Element;
}

export const LazySearchSelect: FC<LazySearchSelectProps> = (props) => {
	const { emptyMessage, ...otherProps } = props;
	return <UiKitLazySearchSelect searchPlaceholder={t("find2")} {...otherProps} emptyText={emptyMessage as any} />;
};
