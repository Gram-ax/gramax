import { cn } from "@core-ui/utils/cn";
import type { HTMLAttributes } from "react";
import { tv } from "tailwind-variants";

type DiffCountProps = HTMLAttributes<HTMLSpanElement> & {
	type: "added" | "deleted";
};

const countVariants = tv({
	base: "font-medium font-mono",
	variants: {
		type: {
			added: "text-status-success",
			deleted: "text-status-error",
		},
	},
});

export const DiffCount = (props: DiffCountProps) => {
	const { type, className, ...rest } = props;
	const countClassName = countVariants({ type });

	return <span className={cn(className, countClassName)} {...rest} />;
};
