import { classNames } from "@components/libs/classNames";
import styled from "@emotion/styled";
import { DialogContent as UiKitDialogContent } from "ics-ui-kit/components/dialog";
import type { FC } from "react";
import type { ExtractComponentGeneric } from "../../lib/extractComponentGeneric";

// FS - full screen
export type ModalContentSize = "default" | "M" | "L" | "FS";

type UiKitDialogContentProps = ExtractComponentGeneric<typeof UiKitDialogContent>;

interface DialogContentTemplateProps extends UiKitDialogContentProps {
	size?: ModalContentSize;
}

export const DialogContent: FC<DialogContentTemplateProps> = styled((props) => {
	const { size, className, ...otherProps } = props;

	return (
		<UiKitDialogContent
			{...otherProps}
			className={classNames(className, {
				"size-l": size === "L",
				"size-M": size === "M",
				"size-FS": size === "FS",
			})}
			data-qa="modal-content"
			data-testid="modal"
		/>
	);
})`
	&.size-l {
		width: calc(100vw - 2rem);
		height: calc(100vh - 2rem);
		max-width: 1200px;
		max-height: 800px;
	}

	&.size-M {
		width: calc(100vw - 2rem);
		max-width: 700px;
		max-height: 700px;
	}

	&.size-l > .grid {
		height: 100%;
	}

	&.size-FS {
		width: 95vw;
		height: 95vh;
		max-width: calc(95vw - 2rem);
		max-height: calc(95vh - 2rem);
	}
`;
