import MediaPreview from "@components/Atoms/Image/modalImage/MediaPreview";
import { classNames } from "@components/libs/classNames";
import ModalToOpenService from "@core-ui/ContextServices/ModalToOpenService/ModalToOpenService";
import ModalToOpen from "@core-ui/ContextServices/ModalToOpenService/model/ModalsToOpen";
import styled from "@emotion/styled";
import DiagramError from "@ext/markdown/elements/diagrams/component/DiagramError";
import { ComponentProps, forwardRef, MutableRefObject } from "react";
import DiagramType from "../../../../../logic/components/Diagram/DiagramType";

interface DiagramProps {
	data?: string;
	error?: Error;
	diagramName: DiagramType;
	openEditor?: () => void;
	className?: string;
	isFull?: boolean;
	background?: boolean;
	title?: string;
	downloadSrc?: string;
	isFrozen?: boolean;
}

const DiagramRender = forwardRef((props: DiagramProps, ref?: MutableRefObject<HTMLDivElement>) => {
	const { data, error, diagramName, className, isFrozen, background = true, title, downloadSrc, openEditor } = props;

	if (error) return <DiagramError diagramName={diagramName} error={error} />;

	const onDoubleClick = () => {
		ModalToOpenService.setValue<ComponentProps<typeof MediaPreview>>(ModalToOpen.MediaPreview, {
			id: diagramName,
			svg: data,
			title: title,
			downloadSrc: downloadSrc,
			openedElement: ref,
			modalEdit: openEditor,
			modalStyle: {
				display: "flex",
				justifyContent: "center",
				backgroundColor: diagramName === DiagramType.mermaid ? "var(--color-diagram-bg)" : "transparent",
				borderRadius: "var(--radius-large)",
				width: diagramName === DiagramType.mermaid ? "30em" : "fit-content",
			},
			onClose: () => {
				ModalToOpenService.resetValue();
			},
		});
	};

	return (
		<div
			className={classNames(`${className} diagram-image`, { "diagram-background": background })}
			data-focusable="true"
		>
			<div
				className={classNames(className, { isFrozen }, [`${diagramName}-diagram`])}
				dangerouslySetInnerHTML={{ __html: data }}
				onDoubleClick={onDoubleClick}
				ref={ref}
			/>
		</div>
	);
});

export default styled(DiagramRender)`
	display: flex;
	width: 100%;
	align-items: center;
	justify-content: center;

	p {
		line-height: 1.5em;
	}

	.isFrozen {
		opacity: 0.4;
	}

	svg {
		user-select: none;
		background: none !important;
		height: ${(p) => (p.isFull ? "100%" : "auto")} !important;
		max-width: 100%;
		max-height: 100% !important;
	}
`;
