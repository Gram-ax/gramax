import { cn } from "@core-ui/utils/cn";
import type { HTMLAttributes } from "react";

export const CatalogViewFieldLabel = ({ className, ...props }: HTMLAttributes<HTMLDivElement>) => {
	return <div className={cn("flex items-center gap-2 w-full justify-between", className)} {...props} />;
};
