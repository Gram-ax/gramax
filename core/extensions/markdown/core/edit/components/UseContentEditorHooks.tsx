import ResourceService from "@ext/markdown/elements/copyArticles/resourceService";
import deleteDiagrams from "@ext/markdown/elements/diagrams/logic/deleteDiagrams";
import deleteDrawio from "@ext/markdown/elements/drawio/edit/logic/deleteDrawio";
import deleteFiles from "@ext/markdown/elements/file/edit/logic/deleteFiles";
import deleteImages from "@ext/markdown/elements/image/edit/logic/deleteImages";
import deleteOpenApi from "@ext/markdown/elements/openApi/edit/logic/deleteOpenApi";
import { Mark } from "@tiptap/pm/model";
import { Node } from "prosemirror-model";
import { useCallback } from "react";

const useContentEditorHooks = () => {
	const resourceService = ResourceService.value;

	const onDeleteNodes = useCallback(
		(nodes: Node[]): void => {
			deleteImages(nodes, resourceService);
			deleteDrawio(nodes, resourceService);
			deleteOpenApi(nodes, resourceService);
			deleteDiagrams(nodes, resourceService);
		},
		[resourceService],
	);

	const onDeleteMarks = useCallback(
		(marks: Mark[]): void => {
			deleteFiles(marks, resourceService);
		},
		[resourceService],
	);

	const onAddMarks = useCallback((): void => {}, []);

	return { onDeleteNodes, onDeleteMarks, onAddMarks };
};

export default useContentEditorHooks;
