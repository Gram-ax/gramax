import { DIAGRAM_FILE_TYPES } from "@ext/git/actions/Publish/logic/ExactResourceViewWithContent";
import DiagramData from "@ext/markdown/elements/diagrams/component/DiagramData";
import Image from "@ext/markdown/elements/image/render/components/Image";
import type { DiffFilePaths } from "@ext/VersionControl/model/Diff";
import { useMemo } from "react";

interface ResourceViewResolverProps {
	type: "image" | "diagram" | "text";

	src: string;
	oldSrc: string;

	extension: string;
	parentPath: DiffFilePaths;
	filePath: DiffFilePaths;

	isDeleteOrAdded: boolean;
}

export const useResourceViewResolver = (props: ResourceViewResolverProps) => {
	const { type, src, oldSrc, extension, parentPath, filePath, isDeleteOrAdded } = props;

	return useMemo(() => {
		const maybeDiagramType = DIAGRAM_FILE_TYPES[extension];
		let element: JSX.Element = null;
		let oldElement: JSX.Element = null;

		if (type === "image") {
			element = (
				<Image
					hasParentPath={!!parentPath?.path}
					marginBottom={"0px"}
					src={parentPath?.path ? src : filePath.path}
				/>
			);
			oldElement = isDeleteOrAdded ? null : (
				<Image
					hasParentPath={!!parentPath?.oldPath}
					marginBottom={"0px"}
					src={parentPath?.oldPath ? oldSrc : filePath.oldPath}
				/>
			);
		} else if (type === "diagram") {
			element = <DiagramData diagramName={maybeDiagramType} src={src} />;
			oldElement = isDeleteOrAdded ? null : <DiagramData diagramName={maybeDiagramType} src={oldSrc} />;
		}

		return { element, oldElement };
	}, [type, src, oldSrc, extension, parentPath, filePath, isDeleteOrAdded]);
};
