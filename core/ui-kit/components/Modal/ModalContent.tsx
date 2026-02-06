import { classNames } from "@components/libs/classNames";
import styled from "@emotion/styled";
import { ModalContent as UiKitModalContent } from "ics-ui-kit/components/modal";
import { FC } from "react";
import { ExtractComponentGeneric } from "../../lib/extractComponentGeneric";

// FS - full screen
export type ModalContentSize = "default" | "M" | "L" | "FS";

type UiKitModalContentProps = ExtractComponentGeneric<typeof UiKitModalContent>;

interface ModalContentTemplateProps extends UiKitModalContentProps {
	size?: ModalContentSize;
}

export const ModalContent: FC<ModalContentTemplateProps> = styled((props) => {
	const { size, className, ...otherProps } = props;

	return (
		<UiKitModalContent
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
