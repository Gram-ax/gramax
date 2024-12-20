import HoverableActions from "@components/controls/HoverController/HoverableActions";
import Signature from "@components/controls/Signature";
import EditorService from "@ext/markdown/elementsUtils/ContextServices/EditorService";
import { FocusEvent, ReactElement, RefObject, useCallback, useState } from "react";

interface BlockActionPanelProps {
	updateAttributes: (attributes: Record<string, any>) => void;
	hoverElementRef: RefObject<HTMLDivElement>;
	getPos: () => number;
	signatureText?: string;
	hasSignature?: boolean;
	signatureRef?: RefObject<HTMLInputElement>;
	children: ReactElement;
	selected?: boolean;
	isOver?: boolean;
	setHasSignature?: (value: boolean) => void;
	isSignature?: boolean;
	leftActions?: ReactElement;
	rightActions?: ReactElement;
}

const BlockActionPanel = (props: BlockActionPanelProps) => {
	const {
		isSignature,
		updateAttributes,
		signatureText,
		leftActions,
		rightActions,
		children,
		hoverElementRef,
		signatureRef,
		selected = false,
		hasSignature,
		setHasSignature,
		getPos,
		isOver,
	} = props;
	const [isHovered, setIsHovered] = useState<boolean>(false);
	const editor = EditorService.getEditor();

	const onUpdate = useCallback((text: string) => updateAttributes({ title: text }), [updateAttributes]);
	const onLoseFocus = useCallback(
		(e: FocusEvent) => {
			const target = e.target as HTMLInputElement;
			if (!hasSignature || target.value.length) return;

			updateAttributes({ title: "" });
			return setHasSignature(false);
		},
		[updateAttributes, hasSignature],
	);

	return (
		<HoverableActions
			hoverElementRef={hoverElementRef}
			isHovered={isHovered}
			isOver={isOver}
			selected={selected}
			setIsHovered={setIsHovered}
			rightActions={rightActions}
			leftActions={leftActions}
		>
			{children}
			{signatureRef && (
				<Signature
					ref={signatureRef}
					autoFocus={!isSignature}
					text={signatureText}
					onUpdate={onUpdate}
					onLoseFocus={onLoseFocus}
					visible={hasSignature}
					getPos={getPos}
					editor={editor}
				/>
			)}
		</HoverableActions>
	);
};

export default BlockActionPanel;
