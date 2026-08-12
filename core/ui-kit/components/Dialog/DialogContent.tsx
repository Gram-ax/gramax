import { DialogContent as UiKitDialogContent } from "ics-ui-kit/components/dialog";
import type { FC } from "react";
import { tv } from "tailwind-variants";
import type { ExtractComponentGeneric } from "../../lib/extractComponentGeneric";

// FS - full screen
export type ModalContentSize = "default" | "M" | "L" | "FS";

const dialogContentStyles = tv({
	variants: {
		size: {
			default: "",
			M: "w-[calc(100vw-2rem)] max-w-[700px] max-h-[700px] lg:max-w-[700px] lg:max-h-[700px]",
			L: [
				"w-[calc(100vw-2rem)] h-[calc(100vh-2rem)]",
				"max-w-[1200px] max-h-[800px] lg:max-w-[1200px] lg:max-h-[800px]",
				"[&>div:nth-of-type(2)]:h-full [&>div:nth-of-type(2)>div]:h-full",
			],
			FS: [
				"w-[95vw] h-[95vh]",
				"max-w-[calc(95vw-2rem)] max-h-[calc(95vh-2rem)]",
				"lg:max-w-[calc(95vw-2rem)] lg:max-h-[calc(95vh-2rem)]",
			],
		},
	},
	defaultVariants: {
		size: "default",
	},
});

type UiKitDialogContentProps = ExtractComponentGeneric<typeof UiKitDialogContent>;

export interface DialogContentTemplateProps extends UiKitDialogContentProps {
	size?: ModalContentSize;
}

export const DialogContent: FC<DialogContentTemplateProps> = (props) => {
	const { size, className, ...otherProps } = props;

	return (
		<UiKitDialogContent
			{...otherProps}
			className={dialogContentStyles({ size, className })}
			data-qa="modal-content"
			data-testid="modal"
		/>
	);
};
