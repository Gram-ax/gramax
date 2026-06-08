import { cn } from "@core-ui/utils/cn";
import t from "@ext/localization/locale/translate";
import type { HTMLAttributes } from "react";

type CatalogViewSectionEmptyProps = HTMLAttributes<HTMLDivElement>;

export const CatalogViewSectionEmpty = ({ className, ...props }: CatalogViewSectionEmptyProps) => {
	return (
		<div
			className={cn("text-xs font-normal cursor-default text-secondary-fg", className)}
			data-testid="catalog-view-empty"
			{...props}
		>
			{t("empty")}
		</div>
	);
};
