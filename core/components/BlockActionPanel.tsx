import Caption from "@components/controls/Caption";
import HoverableActions from "@components/controls/HoverController/HoverableActions";
import { UseDefaultActionsOptions } from "@components/controls/HoverController/hooks/useDefaultActions";
import useWatch from "@core-ui/hooks/useWatch";
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
	actionsOptions?: UseDefaultActionsOptions;
	isSignature?: boolean;
	leftActions?: ReactElement;
	rightActions?: ReactElement;
}

const BlockActionPanel = (props: BlockActionPanelProps) => {
	const {
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
		actionsOptions,
	} = props;
	const [isHovered, setIsHovered] = useState<boolean>(false);
	const editor = EditorService.getEditor();

	const onUpdate = useCallback((text: string) => updateAttributes({ title: text }), [updateAttributes]);
	const onLoseFocus = useCallback(
		(e: FocusEvent) => {
			const target = e.target as HTMLInputElement;
			if (hasSignature || target.value.length) return;

			updateAttributes({ title: "" });
			return setHasSignature(false);
		},
		[updateAttributes, hasSignature],
	);

	useWatch(() => {
		if (!hasSignature && signatureText?.length) return setHasSignature(true);
	}, [signatureText]);

	return (
		<HoverableActions
			actionsOptions={actionsOptions}
			hoverElementRef={hoverElementRef}
			isHovered={isHovered}
			isOver={isOver}
			leftActions={leftActions}
			rightActions={rightActions}
			selected={selected}
			setIsHovered={setIsHovered}
		>
			{children}
			{signatureRef && (
				<Caption
					editor={editor}
					getPos={getPos}
					onLoseFocus={onLoseFocus}
					onUpdate={onUpdate}
					ref={signatureRef}
					text={signatureText}
					visible={hasSignature}
				/>
			)}
		</HoverableActions>
	);
};

export default BlockActionPanel;
