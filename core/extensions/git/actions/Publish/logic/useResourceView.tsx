import DiffContent from "@components/Atoms/DiffContent";
import ApiUrlCreator from "@core-ui/ApiServices/ApiUrlCreator";
import ApiUrlCreatorService from "@core-ui/ContextServices/ApiUrlCreator";
import Path from "@core/FileProvider/Path/Path";
import DiagramType from "@core/components/Diagram/DiagramType";
import styled from "@emotion/styled";
import SideBarResourceData from "@ext/git/actions/Publish/model/SideBarResourceData";
import DiagramData from "@ext/markdown/elements/diagrams/component/DiagramData";
import Image from "@ext/markdown/elements/image/render/components/Image";

const IMG_FILE_TYPES = ["png", "jpg", "jpeg", "bmp", "svg", "gif"];
const DIAGRAM_FILE_TYPES = {
	mermaid: DiagramType.mermaid,
	puml: DiagramType["plant-uml"],
	ts: DiagramType["ts-diagram"],
	dsl: DiagramType["c4-diagram"],
};

const useExactView = (id: number, resource: SideBarResourceData, relativeTo?: Path) => {
	const resourcePath = new Path(resource.filePath.path);
	const ext = resourcePath.extension;
	const src = relativeTo ? relativeTo.getRelativePath(resourcePath).value : resourcePath.nameWithExtension;
	const maybeDiagramType = DIAGRAM_FILE_TYPES[ext];
	if (IMG_FILE_TYPES.includes(ext))
		return (
			<Center className="article" key={id}>
				<Image src={src} />
			</Center>
		);

	if (maybeDiagramType)
		return (
			<Center className="article" key={id}>
				<DiagramData src={src} diagramName={maybeDiagramType} />
			</Center>
		);

	return (
		<div className="diff-content">
			<DiffContent showDiff={true} changes={resource.diff?.changes ?? []} />
		</div>
	);
};

const Center = styled.div`
	display: flex;
	justify-content: center;
	align-items: center;
	width: 100%;
	height: 100%;
`;

export const useResourceView = (
	id: number,
	apiUrlCreator: ApiUrlCreator,
	resource: SideBarResourceData,
	relativeTo?: Path,
) => (
	<ApiUrlCreatorService.Provider value={apiUrlCreator}>
		{useExactView(id, resource, relativeTo)}
	</ApiUrlCreatorService.Provider>
);
