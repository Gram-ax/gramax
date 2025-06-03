import ApiUrlCreator from "@core-ui/ApiServices/ApiUrlCreator";
import { EditorView } from "prosemirror-view";
import Path from "../../../../../../logic/FileProvider/Path/Path";
import { ResourceServiceType } from "@ext/markdown/elements/copyArticles/resourceService";

const createFile = async (files: File[], view: EditorView, apiUrlCreator: ApiUrlCreator, rs: ResourceServiceType) => {
	files = files.filter((f) => f);
	if (!files.length) return;

	for (const file of files) {
		const newName = await rs.setResource(file.name, Buffer.from(await file.arrayBuffer()), undefined, true);
		const newFilePath = new Path(newName);

		const { from, to } = view.state.selection;
		const value = newFilePath.extension ? newFilePath.nameWithExtension : newFilePath.name;
		const mark = view.state.schema.marks.file.create({
			href: apiUrlCreator.getArticleResource(newName).toString(),
			value,
			resourcePath: newName,
		});

		if (from == to) view.dispatch(view.state.tr.insert(from, view.state.schema.text(value, [mark])));
		else view.dispatch(view.state.tr.addMark(from, to, mark));
	}
};

export default createFile;
