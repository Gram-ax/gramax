import { useDraggable, useDroppable } from "@dnd-kit/core";
import {
	SideMenuItemContent,
	type SideMenuItemContentProps,
} from "@ext/navigation/catalog/SidebarNavigation/components/Helpers/SideMenuItemContent";
import { type MutableRefObject, type ReactNode, useCallback } from "react";

interface ItemDroppableProps {
	id: string;
	children: ReactNode;
	itemRef?: MutableRefObject<HTMLDivElement>;
}

export const ItemDroppable = ({ id, children, itemRef }: ItemDroppableProps) => {
	const { setNodeRef } = useDroppable({ id });
	const setRef = useCallback(
		(element: HTMLDivElement | null) => {
			if (itemRef) itemRef.current = element;
			setNodeRef(element);
		},
		[itemRef, setNodeRef],
	);

	return (
		<div className="relative" ref={setRef}>
			{children}
		</div>
	);
};

type DraggableSideMenuItemContentProps = Omit<
	SideMenuItemContentProps,
	"draggableRef" | "dragListeners" | "dragAttributes"
> & {
	id: string;
	disabled: boolean;
};

export const DraggableSideMenuItemContent = ({ id, disabled, ...props }: DraggableSideMenuItemContentProps) => {
	const { attributes, listeners, setNodeRef } = useDraggable({ id, disabled });

	return (
		<SideMenuItemContent
			{...props}
			dragAttributes={attributes}
			draggableRef={setNodeRef}
			dragListeners={listeners}
		/>
	);
};
