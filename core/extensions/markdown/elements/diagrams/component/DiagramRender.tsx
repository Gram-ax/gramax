import type MediaPreview from "@components/Atoms/Image/modalImage/MediaPreview";
import ModalToOpenService from "@core-ui/ContextServices/ModalToOpenService/ModalToOpenService";
import ModalToOpen from "@core-ui/ContextServices/ModalToOpenService/model/ModalsToOpen";
import ResourceService from "@core-ui/ContextServices/ResourceService/ResourceService";
import { cn } from "@core-ui/utils/cn";
import { ArticleComponentResizer } from "@ext/article/Components/ArticleComponentResizer";
import DiagramError from "@ext/markdown/elements/diagrams/component/DiagramError";
import { type ComponentProps, forwardRef, type MutableRefObject, useCallback } from "react";
import DiagramType from "../../../../../logic/components/Diagram/DiagramType";

interface DiagramProps {
	data?: string;
	error?: Error;
	diagramName: DiagramType;
	className?: string;
	isFull?: boolean;
	background?: boolean;
	title?: string;
	downloadSrc?: string;
	isFrozen?: boolean;
	scale?: number;
	openEditor?: () => void;
	isPrint?: boolean;
}

const DiagramRender = forwardRef((props: DiagramProps, ref?: MutableRefObject<HTMLDivElement>) => {
	const {
		data,
		error,
		diagramName,
		className,
		isFull,
		isFrozen,
		background = true,
		title,
		downloadSrc,
		openEditor,
		scale,
		isPrint,
	} = props;
	const { id: resourceId, provider: resourceProvider } = ResourceService.value;

	const onDoubleClick = useCallback(() => {
		ModalToOpenService.setValue<ComponentProps<typeof MediaPreview>>(ModalToOpen.MediaPreview, {
			id: diagramName,
			svg: data,
			title: title,
			downloadSrc: downloadSrc,
			resourceId,
			resourceProvider,
			openedElement: ref,
			modalEdit: openEditor,
			modalStyle: {
				display: "flex",
				justifyContent: "center",
				backgroundColor: diagramName === DiagramType.mermaid ? "var(--color-diagram-bg)" : "transparent",
				borderRadius: "var(--radius-large)",
			},
			onClose: () => {
				ModalToOpenService.resetValue();
			},
		});
	}, [diagramName, data, title, downloadSrc, resourceId, resourceProvider, openEditor, ref]);

	if (error) return <DiagramError diagramName={diagramName} error={error} />;

	const diagram = (
		<div
			className={cn(
				className,
				"diagram-image flex w-full items-center justify-center",
				background && "diagram-background",
			)}
			data-focusable="true"
		>
			<div
				className={cn(
					className,
					"flex w-full items-center justify-center",
					isFrozen && "opacity-40",
					`${diagramName}-diagram`,
					"[&>svg]:select-none [&>svg]:!bg-transparent [&>svg]:!max-w-full [&>svg]:!max-h-full [&>svg]:!w-full",
					isFull ? "[&>svg]:!h-full" : "[&>svg]:!h-auto",
				)}
				// biome-ignore lint/style/useNamingConvention: expected
				dangerouslySetInnerHTML={{ __html: data }}
				onDoubleClick={onDoubleClick}
				ref={ref}
			/>
		</div>
	);

	if (openEditor) return diagram;

	return (
		<ArticleComponentResizer disabled={!openEditor} isPrint={isPrint} scale={scale}>
			{diagram}
		</ArticleComponentResizer>
	);
});

export default DiagramRender;
