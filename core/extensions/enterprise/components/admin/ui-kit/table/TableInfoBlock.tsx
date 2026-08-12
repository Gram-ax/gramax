import { cn } from "@core-ui/utils/cn";
import { sectionTitleClass } from "@ext/enterprise/components/admin/ui-kit/SettingsSection";

interface TableInfoBlockProps {
	titleClassName?: string;
	descriptionClassName?: string;
	title?: React.ReactNode;
	description?: React.ReactNode;
}

export const TableInfoBlock = ({ titleClassName, descriptionClassName, title, description }: TableInfoBlockProps) => {
	return (
		<div className={"flex gap-2 items-baseline"}>
			{title && <h2 className={cn(sectionTitleClass, titleClassName)}>{title}</h2>}
			{description !== undefined && <span className={cn("text-lg", descriptionClassName)}>{description}</span>}
		</div>
	);
};
