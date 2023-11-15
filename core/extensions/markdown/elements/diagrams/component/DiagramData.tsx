import SpinnerLoader from "@components/Atoms/SpinnerLoader";
import FetchService from "@core-ui/ApiServices/FetchService";
import ApiUrlCreatorService from "@core-ui/ContextServices/ApiUrlCreator";
import diagramComponents from "@ext/markdown/elements/diagrams/component/diagramComponents";
import { Suspense, useEffect, useMemo, useState } from "react";
import DiagramType from "../../../../../logic/components/Diagram/DiagramType";
import C4Render from "./C4Render";
import DiagramRender from "./DiagramRender";

export default function DiagramData({
	src,
	title,
	content,
	diagramName,
	isUpdating = false,
}: {
	src?: string;
	title?: string;
	content?: string;
	isUpdating?: boolean;
	diagramName: DiagramType;
}) {
	const diagramElement = useMemo(() => {
		const diagramComponent = diagramComponents[diagramName];
		if (!diagramComponent) return null;

		return (
			<>
				<Suspense fallback={<SpinnerLoader width={75} height={75} />}>
					{diagramComponent(content, src, isUpdating)}
				</Suspense>
				{title && <em>{title}</em>}
			</>
		);
	}, [content, src, title, isUpdating]);

	if (diagramComponents[diagramName]) return diagramElement;

	const isC4Diagram = diagramName == DiagramType["c4-diagram"];
	const apiUrlCreator = ApiUrlCreatorService.value;
	const [data, setData] = useState(null);
	const [error, setError] = useState(null);

	const loadData = () => {
		setData(null);
		setError(null);

		(async () => {
			const res = await FetchService.fetch(
				content
					? apiUrlCreator.getDiagramByContentUrl(content, diagramName)
					: apiUrlCreator.getDiagram(src, diagramName),
			);

			if (!res.ok) return setError(await res.json());
			const data = await (isC4Diagram ? res.json() : res.text());
			setData(data);
		})();
	};

	useEffect(loadData, [isUpdating]);

	return (
		<>
			{isC4Diagram ? (
				<C4Render data={data} error={error} />
			) : (
				<DiagramRender diagramName={diagramName} data={data} error={error} />
			)}
			{title && !error && <em>{title}</em>}
		</>
	);
}
