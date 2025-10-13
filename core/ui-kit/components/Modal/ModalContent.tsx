import { ModalContent as UiKitModalContent } from "ics-ui-kit/components/modal";
import { ExtractComponentGeneric } from "../../lib/extractComponentGeneric";
import { FC } from "react";
import styled from "@emotion/styled";
import { classNames } from "@components/libs/classNames";

export type ModalContentSize = "default" | "M" | "L";

type UiKitModalContentProps = ExtractComponentGeneric<typeof UiKitModalContent>;

interface ModalContentTemplateProps extends UiKitModalContentProps {
	size?: ModalContentSize;
}

export const ModalContent: FC<ModalContentTemplateProps> = styled((props) => {
	const { size, className, ...otherProps } = props;

	return (
		<UiKitModalContent
			{...otherProps}
			data-qa="modal-content"
			className={classNames(className, {
				"size-l": size === "L",
				"size-M": size === "M",
			})}
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
		max-height: 800px;
	}

	&.size-l > .grid {
		height: 100%;
	}
`;
