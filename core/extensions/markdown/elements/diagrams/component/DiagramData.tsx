import Skeleton from "@components/Atoms/ImageSkeleton";
import ArticleRefService from "@core-ui/ContextServices/ArticleRef";
import PageDataContextService from "@core-ui/ContextServices/PageDataContext";
import type { ResourceError } from "@core-ui/ContextServices/ResourceService/errors";
import { useGetResource } from "@core-ui/ContextServices/ResourceService/hooks/useGetResource";
import ResourceService from "@core-ui/ContextServices/ResourceService/ResourceService";
import { useAdjustedElementSize } from "@core-ui/hooks/useAdjustedElementSize";
import ErrorConfirmService from "@ext/errorHandlers/client/ErrorConfirmService";
import BlockCommentView from "@ext/markdown/elements/comment/edit/components/View/BlockCommentView";
import getMermaidDiagram from "@ext/markdown/elements/diagrams/diagrams/mermaid/getMermaidDiagram";
import getPlantUmlDiagram from "@ext/markdown/elements/diagrams/diagrams/plantUml/getPlantUmlDiagram";
import { useCallback, useEffect, useRef, useState } from "react";
import DiagramType from "../../../../../logic/components/Diagram/DiagramType";
import DiagramRender from "./DiagramRender";

const DIAGRAM_FUNCTIONS = {
	[DiagramType.mermaid]: getMermaidDiagram,
	[DiagramType["plant-uml"]]: getPlantUmlDiagram,
};

interface DiagramDataProps {
	diagramName: DiagramType;
	src?: string;
	title?: string;
	content?: string;
	commentId?: string;
	noEm?: boolean;
	width?: string;
	height?: string;
	float?: string;
	isPrint?: boolean;
	scale?: number;
	openEditor?: () => void;
}

const DiagramData = (props: DiagramDataProps) => {
	const { src, title, content, diagramName, openEditor, width, height, noEm, commentId, float, isPrint, scale } =
		props;
	const diagramsServiceUrl = PageDataContextService.value.conf.diagramsServiceUrl;
	const { getBuffer } = ResourceService.value;

	const articleRef = ArticleRefService.value;
	const ref = useRef<HTMLDivElement | HTMLImageElement>(null);
	const [data, setData] = useState(null);
	const [isLoaded, setIsLoaded] = useState(false);
	const [error, setError] = useState<ResourceError>(null);

	const getParentWidth = useCallback(
		() => articleRef?.current?.firstElementChild?.firstElementChild?.clientWidth ?? 0,
		[articleRef],
	);

	const size = useAdjustedElementSize({ width, height, scale, getParentWidth });

	// biome-ignore lint/correctness/useExhaustiveDependencies: expected
	useEffect(() => {
		const buffer = getBuffer(src);
		if (!buffer?.byteLength) return;
		setIsLoaded(true);
		setData(buffer);
	}, []);

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
		<div
			data-component="diagram"
			data-float={float && !openEditor ? float : undefined}
			data-qa="qa-diagram-data"
			data-resize-container={float && !openEditor ? true : undefined}
			data-testid={diagramName}
		>
			<BlockCommentView commentId={commentId} style={{ borderRadius: "var(--radius-large)" }}>
				<Skeleton height={size?.height} isLoaded={isLoaded} width={size?.width}>
					<DiagramRender
						data={data}
						diagramName={diagramName}
						downloadSrc={src}
						error={error}
						openEditor={openEditor}
						ref={ref}
						scale={scale}
						title={title}
					/>
				</Skeleton>
			</BlockCommentView>
			{title && !error && !noEm && <em>{title}</em>}
		</div>
	);
};

export default DiagramData;
