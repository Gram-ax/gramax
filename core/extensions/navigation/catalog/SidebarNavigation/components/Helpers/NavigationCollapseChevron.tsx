import { cn } from "@core-ui/utils/cn";
import { CollapsibleTrigger } from "@ui-kit/Collapsible";
import { Icon } from "@ui-kit/Icon";

interface NavigationCollapseChevronProps {
	open: boolean;
}

export const NavigationCollapseChevron = ({ open }: NavigationCollapseChevronProps) => (
	<CollapsibleTrigger asChild>
		<span
			className="angle group/actions flex size-4 items-center justify-center text-muted-foreground"
			data-collapsible-trigger
		>
			<Icon
				className={cn(
					"shrink-0 stroke-[2.5] text-muted transition-transform group-hover/actions:text-primary-fg",
					open && "rotate-90",
				)}
				icon="chevron-right"
				size="sm"
			/>
		</span>
	</CollapsibleTrigger>
);
