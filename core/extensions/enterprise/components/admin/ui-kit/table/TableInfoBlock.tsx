import { cn } from "@core-ui/utils/cn";

interface TableInfoBlockProps {
	titleClassName?: string;
	descriptionClassName?: string;
	title?: React.ReactNode;
	description?: React.ReactNode;
}

export const TableInfoBlock = ({ titleClassName, descriptionClassName, title, description }: TableInfoBlockProps) => {
	return (
		<div className={"flex gap-2"}>
			{title && <h2 className={cn("font-medium text-lg", titleClassName)}>{title}</h2>}
			{description !== undefined && <span className={cn("text-lg", descriptionClassName)}>{description}</span>}
		</div>
	);
};
