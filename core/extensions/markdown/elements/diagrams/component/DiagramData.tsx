import Skeleton from "@components/Atoms/ImageSkeleton";
import PageDataContextService from "@core-ui/ContextServices/PageDataContext";
import getAdjustedSize from "@core-ui/utils/getAdjustedSize";
import ErrorConfirmService from "@ext/errorHandlers/client/ErrorConfirmService";
import BlockCommentView from "@ext/markdown/elements/comment/edit/components/View/BlockCommentView";
import ResourceService from "@ext/markdown/elements/copyArticles/resourceService";
import getMermaidDiagram from "@ext/markdown/elements/diagrams/diagrams/mermaid/getMermaidDiagram";
import getPlantUmlDiagram from "@ext/markdown/elements/diagrams/diagrams/plantUml/getPlantUmlDiagram";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import DiagramType from "../../../../../logic/components/Diagram/DiagramType";
import DiagramRender from "./DiagramRender";

const DIAGRAM_FUNCTIONS = {
	[DiagramType.mermaid]: getMermaidDiagram,
	[DiagramType["plant-uml"]]: getPlantUmlDiagram,
};

interface DiagramDataProps {
	diagramName: DiagramType;
	openEditor?: () => void;
	src?: string;
	title?: string;
	content?: string;
	commentId?: string;
	noEm?: boolean;
	width?: string;
	height?: string;
	float?: string;
	isPrint?: boolean;
}

const DiagramData = (props: DiagramDataProps) => {
	const { src, title, content, diagramName, openEditor, width, height, noEm, commentId, float, isPrint } = props;
	const diagramsServiceUrl = PageDataContextService.value.conf.diagramsServiceUrl;
	const { useGetResource, getBuffer } = ResourceService.value;

	const ref = useRef<HTMLDivElement | HTMLImageElement>(null);
	const parentRef = useRef<HTMLDivElement>(null);
	const [data, setData] = useState(null);
	const [isLoaded, setIsLoaded] = useState(false);
	const [error, setError] = useState(null);
	const [size, setSize] = useState<{ width: string; height: string }>(null);

	useEffect(() => {
		const buffer = getBuffer(src);
		if (!buffer?.byteLength) return;
		setIsLoaded(true);
		setData(buffer);
	}, []);

	useLayoutEffect(() => {
		if (!width?.endsWith("px")) return;
		const parentWidth = parentRef.current?.clientWidth;
		const container = ref.current;

		if (!parentWidth || !container) return;
		const newSize = getAdjustedSize(parseFloat(width), parseFloat(height), parentWidth);
		const computedStyleOne = window.getComputedStyle(container.parentElement);
		const computedStyleTwo = window.getComputedStyle(container);
		const offset = parseFloat(computedStyleTwo.marginTop) * 2 + parseFloat(computedStyleOne.paddingTop) * 2;
		setSize({ width: parentWidth + "px", height: newSize.height + offset + "px" });
	}, [width, height]);

	useGetResource(
		async (buffer, resourceError) => {
			ErrorConfirmService.stop();
			try {
				if (resourceError) {
					setError(resourceError);
					setIsLoaded(true);
					ErrorConfirmService.start();
					return;
				}
				setError(null);
				setData(await DIAGRAM_FUNCTIONS?.[diagramName](buffer?.toString(), diagramsServiceUrl));
			} catch (err) {
				setError(err);
			}
			ErrorConfirmService.start();

			setIsLoaded(true);
		},
		src,
		content,
		undefined,
		isPrint,
	);

	return (
		<div data-float={float} data-qa="qa-diagram-data" ref={parentRef}>
			<BlockCommentView commentId={commentId} style={{ borderRadius: "var(--radius-large)" }}>
				<Skeleton height={size?.height} isLoaded={isLoaded} width={size?.width}>
					<DiagramRender
						data={data}
						diagramName={diagramName}
						downloadSrc={src}
						error={error}
						openEditor={openEditor}
						ref={ref}
						title={title}
					/>
				</Skeleton>
			</BlockCommentView>
			{title && !error && !noEm && <em>{title}</em>}
		</div>
	);
};

export default DiagramData;
