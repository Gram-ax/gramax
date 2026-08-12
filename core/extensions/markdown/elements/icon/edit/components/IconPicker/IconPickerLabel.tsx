import { cn } from "@core-ui/utils/cn";
import { useComponentVariant } from "@ui-kit/hooks/useComponentVariant";
import { Label } from "@ui-kit/Label";

export const IconPickerLabel = ({ className, ...props }: React.HTMLAttributes<HTMLLabelElement>) => {
	const { variant: theme } = useComponentVariant();
	return (
		<Label
			className={cn(
				"uppercase text-sm font-normal ml-1",
				theme === "inverse" ? "text-inverse-muted" : "text-muted-foreground",
				className,
			)}
			{...props}
		/>
	);
};
