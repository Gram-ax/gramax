import DiffContent from "@components/Atoms/DiffContent";
import ApiUrlCreatorService from "@core-ui/ContextServices/ApiUrlCreator";
import getIsDevMode from "@core-ui/utils/getIsDevMode";
import Path from "@core/FileProvider/Path/Path";
import DiagramType from "@core/components/Diagram/DiagramType";
import styled from "@emotion/styled";
import type { DiffHunk } from "@ext/VersionControl/DiffHandler/model/DiffHunk";
import useExactArticleView, { UseResourceArticleViewType } from "@ext/git/actions/Publish/logic/useResourceArticleView";
import DiagramData from "@ext/markdown/elements/diagrams/component/DiagramData";
import Image from "@ext/markdown/elements/image/render/components/Image";

const IMG_FILE_TYPES = ["png", "jpg", "jpeg", "bmp", "svg", "gif"];
const DIAGRAM_FILE_TYPES = {
	mermaid: DiagramType.mermaid,
	puml: DiagramType["plant-uml"],
	ts: DiagramType["ts-diagram"],
	dsl: DiagramType["c4-diagram"],
};

const useExactView = (id: number, resourcePath: Path, relativeTo?: Path, diff?: DiffHunk[]) => {
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
		<DiffPadding>
			<DiffContent showDiff={true} changes={diff ?? []} />
		</DiffPadding>
	);
};

const Center = styled.div`
	display: flex;
	justify-content: center;
	align-items: center;
	width: 100%;
	height: 100%;
`;

const DiffPadding = styled.div`
	padding: 20px;
`;

interface UseResourceViewType extends UseResourceArticleViewType {
	diff?: DiffHunk[];
}

export const useResourceView = (props: UseResourceViewType) => {
	const { id, apiUrlCreator, resourcePath, diff, relativeTo } = props;
	const isDevMode = getIsDevMode();
	if (!isDevMode) {
		return (
			<ApiUrlCreatorService.Provider value={apiUrlCreator}>
				{useExactView(id, resourcePath, relativeTo, diff)}
			</ApiUrlCreatorService.Provider>
		);
	}

	return useExactArticleView(props);
};
