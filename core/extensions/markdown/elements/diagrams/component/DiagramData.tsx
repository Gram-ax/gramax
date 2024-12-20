import FetchService from "@core-ui/ApiServices/FetchService";
import ApiUrlCreatorService from "@core-ui/ContextServices/ApiUrlCreator";
import getMermaidDiagram from "@ext/markdown/elements/diagrams/diagrams/mermaid/getMermaidDiagram";
import getPlantUmlDiagram from "@ext/markdown/elements/diagrams/diagrams/plantUml/getPlantUmlDiagram";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import DiagramType from "../../../../../logic/components/Diagram/DiagramType";
import C4Render from "./C4Render";
import DiagramRender from "./DiagramRender";
import PageDataContextService from "@core-ui/ContextServices/PageDataContext";
import OnLoadResourceService from "@ext/markdown/elements/copyArticles/onLoadResourceService";
import Skeleton from "@components/Atoms/Skeleton";
import getAdjustedSize from "@core-ui/utils/getAdjustedSize";

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
	noEm?: boolean;
	width?: string;
	height?: string;
	readFromHead?: boolean;
}

const DiagramData = (props: DiagramDataProps) => {
	const { src, title, content, diagramName, openEditor, readFromHead, width, height, noEm } = props;
	const isC4Diagram = diagramName == DiagramType["c4-diagram"];
	const apiUrlCreator = ApiUrlCreatorService.value;
	const diagramsServiceUrl = PageDataContextService.value.conf.diagramsServiceUrl;
	const { useGetContent, getBuffer } = OnLoadResourceService.value;

	const ref = useRef<HTMLDivElement | HTMLImageElement>(null);
	const parentRef = useRef<HTMLDivElement>(null);
	const [data, setData] = useState(null);
	const [isLoaded, setIsLoaded] = useState(false);
	const [error, setError] = useState(null);
	const [size, setSize] = useState<{ width: string; height: string }>(null);

	const getAnyDiagrams = async (content: string) => {
		const res = await FetchService.fetch(apiUrlCreator.getDiagramByContentUrl(diagramName), content);
		if (!res.ok) return setError(await res.json());
		return isC4Diagram ? await res.json() : await res.text();
	};

	useEffect(() => {
		const buffer = getBuffer(src);
		if (!buffer?.byteLength) return;
		setIsLoaded(true);
		setData(buffer);
	}, []);

	useLayoutEffect(() => {
		if (!width?.endsWith("px")) return;
		const parentWidth = parentRef.current?.clientWidth;

		if (!parentWidth) return;
		const newSize = getAdjustedSize(parseFloat(width), parseFloat(height), parentWidth);
		const computedStyleOne = window.getComputedStyle(ref.current.parentElement);
		const computedStyleTwo = window.getComputedStyle(ref.current);
		const offset = parseFloat(computedStyleTwo.marginTop) * 2 + parseFloat(computedStyleOne.paddingTop) * 2;
		setSize({ width: parentWidth + "px", height: newSize.height + offset + "px" });
	}, [width, height]);

	useGetContent(
		src,
		apiUrlCreator,
		async (buffer: Buffer) => {
			try {
				setError(null);
				const diagramData = DIAGRAM_FUNCTIONS?.[diagramName]
					? await DIAGRAM_FUNCTIONS?.[diagramName](buffer.toString(), diagramsServiceUrl)
					: await getAnyDiagrams(buffer.toString());
				setData(diagramData);
			} catch (err) {
				setError(err);
			}

			setIsLoaded(true);
		},
		content,
		readFromHead,
	);

	return (
		<div ref={parentRef} data-qa="qa-diagram-data">
			<Skeleton isLoaded={isLoaded} width={size?.width} height={size?.height}>
				{isC4Diagram ? (
					<C4Render data={data} error={error} />
				) : (
					<DiagramRender
						openEditor={openEditor}
						ref={ref}
						downloadSrc={src}
						title={title}
						diagramName={diagramName}
						data={data}
						error={error}
					/>
				)}
			</Skeleton>
			{title && !error && !noEm && <em>{title}</em>}
		</div>
	);
};

export default DiagramData;
