import { IconButton } from "@ui-kit/Button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@ui-kit/Tooltip";
import type { MouseEvent } from "react";
import { tv } from "tailwind-variants";

const actionStyles = tv({
	base: "p-0 h-3.5 !w-0 opacity-0 transition-all duration-150 ease-in-out text-[var(--color-nav-item)] hover:text-[var(--color-nav-item-selected)]! group-hover:pl-[var(--distance-i-span)] group-hover:!w-[1.5em] group-hover:opacity-100",
});

interface DiffEntryActionProps {
	icon: string;
	tooltip: string;
	onClick: (e: MouseEvent<HTMLButtonElement>) => void;
}

const DiffEntryAction = ({ icon, tooltip, onClick }: DiffEntryActionProps) => (
	<Tooltip>
		<TooltipContent>{tooltip}</TooltipContent>
		<TooltipTrigger asChild>
			<IconButton
				className={actionStyles()}
				data-qa="qa-discard-button"
				icon={icon}
				onClick={onClick}
				size="xs"
				variant="text"
			/>
		</TooltipTrigger>
	</Tooltip>
);

export default DiffEntryAction;
