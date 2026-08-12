import { cn } from "@core-ui/utils/cn";
import { InsertionDepthIcon } from "@ext/navigation/catalog/SidebarNavigation/components/SidebarInsertionLine/InsertionDepthIcon";
import { InsertionTailLine } from "@ext/navigation/catalog/SidebarNavigation/components/SidebarInsertionLine/InsertionTailLine";
import { useCreateArticle } from "@ext/navigation/catalog/SidebarNavigation/hooks/useCreateArticle";
import { useNavigationTreeStore } from "@ext/navigation/catalog/SidebarNavigation/store/navigationTreeStore";
import { INSERTION_BUTTON_SIZE } from "@ext/navigation/catalog/SidebarNavigation/utils/constants";
import { iconLeft } from "@ext/navigation/catalog/SidebarNavigation/utils/sidebarInsertionLineUtils";
import { useState } from "react";

interface AfterContainerInsertionLineProps {
	isVisible: boolean;
}

export const AfterContainerInsertionLine = ({ isVisible }: AfterContainerInsertionLineProps) => {
	const [isActive, setIsActive] = useState(false);
	const lastGroupId = useNavigationTreeStore((s) => s.rootIds[s.rootIds.length - 1]);
	const createArticle = useCreateArticle();

	if (!isVisible) return null;

	const left = iconLeft(1, 0);
	const tailLeft = left + INSERTION_BUTTON_SIZE;

	return (
		<div className="group/insertion relative z-10 mx-2 mt-3 h-1" data-sidebar="after-container-insertion-line">
			<InsertionDepthIcon
				isActive={isActive}
				isHidden={false}
				isPlaceholder={false}
				onClick={() => createArticle(undefined, lastGroupId)}
				onMouseEnter={() => setIsActive(true)}
				onMouseLeave={() => setIsActive(false)}
				style={{ cursor: "pointer", left }}
			/>
			<InsertionTailLine
				className={cn(
					"!opacity-100",
					isActive
						? "bg-primary-fg"
						: "[background:linear-gradient(90deg,hsl(var(--muted))_0%,rgba(113,113,122,0.00)_100%)]",
				)}
				style={{ left: tailLeft }}
			/>
		</div>
	);
};
