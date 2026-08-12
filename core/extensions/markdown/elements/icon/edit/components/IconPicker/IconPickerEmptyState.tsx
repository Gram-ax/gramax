import { cn } from "@core-ui/utils/cn";
import t from "@ext/localization/locale/translate";
import { EmptyState } from "@ui-kit/EmptyState";
import { useComponentVariant } from "@ui-kit/hooks/useComponentVariant";

export const IconPickerEmptyState = () => {
	const { variant: theme } = useComponentVariant();
	return (
		<EmptyState className={cn(theme === "inverse" && "text-inverse-secondary-fg")}>
			{t("list.no-results-found")}
		</EmptyState>
	);
};
