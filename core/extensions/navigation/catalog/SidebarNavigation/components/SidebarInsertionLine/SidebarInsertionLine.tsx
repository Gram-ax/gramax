import { cn } from "@core-ui/utils/cn";
import { InsertionConnectorLine } from "@ext/navigation/catalog/SidebarNavigation/components/SidebarInsertionLine/InsertionConnectorLine";
import { InsertionDepthIcon } from "@ext/navigation/catalog/SidebarNavigation/components/SidebarInsertionLine/InsertionDepthIcon";
import { InsertionTailLine } from "@ext/navigation/catalog/SidebarNavigation/components/SidebarInsertionLine/InsertionTailLine";
import { useInsertionLine } from "@ext/navigation/catalog/SidebarNavigation/hooks/useInsertionLine";
import { Fragment, forwardRef } from "react";

export type SidebarInsertionLineProps = {
	className?: string;
	minDepth: number;
	maxDepth: number;
	level: number;
	onAdd: (depth: number) => void;
	onParentHover?: (depth: number | null) => void;
};

export const SidebarInsertionLine = forwardRef<HTMLDivElement, SidebarInsertionLineProps>(
	({ className, minDepth, maxDepth, level, onAdd, onParentHover }, ref) => {
		const { items, tailLeft, isTailSolid, clickableDepth, handleMouseMove, handleMouseLeave } = useInsertionLine({
			minDepth,
			maxDepth,
			levelOffset: level - 1,
			onParentHover,
		});

		const handleClick = (event: React.MouseEvent<HTMLDivElement>) => {
			if (clickableDepth) {
				onAdd(clickableDepth);
				return;
			}

			const interactiveElementBehind = document
				.elementsFromPoint(event.clientX, event.clientY)
				.map((element) => element.closest<HTMLElement>("a, button, [role='button']"))
				.find((element) => element && !event.currentTarget.contains(element));

			interactiveElementBehind?.click();
		};

		return (
			<div
				className={cn(
					"group/insertion absolute inset-x-0 bottom-0 z-10 h-1",
					clickableDepth && "cursor-pointer",
					className,
				)}
				data-sidebar="sidebar-insertion-line"
				onClick={handleClick}
				onMouseLeave={handleMouseLeave}
				onMouseMove={handleMouseMove}
				ref={ref}
			>
				{items.map(({ depth, isHidden, isPlaceholder, isActive, iconLeft, connectorLeft }) => (
					<Fragment key={depth}>
						{connectorLeft && (
							<InsertionConnectorLine isHidden={isHidden} style={{ left: connectorLeft }} />
						)}
						<InsertionDepthIcon
							isActive={isActive}
							isHidden={isHidden}
							isPlaceholder={isPlaceholder}
							style={{ left: iconLeft }}
						/>
					</Fragment>
				))}

				<InsertionTailLine
					className={
						isTailSolid
							? "bg-primary-fg"
							: "[background:linear-gradient(90deg,hsl(var(--muted))_0%,rgba(113,113,122,0.00)_100%)]"
					}
					style={{ left: tailLeft }}
				/>
			</div>
		);
	},
);
SidebarInsertionLine.displayName = "SidebarInsertionLine";
