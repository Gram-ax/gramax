import ApiUrlCreator from "@core-ui/ApiServices/ApiUrlCreator";
import { EditorView } from "prosemirror-view";
import Path from "../../../../../../logic/FileProvider/Path/Path";
import FetchService from "../../../../../../ui-logic/ApiServices/FetchService";
import MimeTypes from "../../../../../../ui-logic/ApiServices/Types/MimeTypes";
import fileNameUtils from "../../../../../../ui-logic/fileNameUtils";
import getArticleFileBrotherNames from "../../../../elementsUtils/AtricleResource/getAtricleResourceNames";

const createFile = async (files: File[], view: EditorView, apiUrlCreator: ApiUrlCreator) => {
	files = files.filter((f) => f);
	if (!files.length) return;
	const names = await getArticleFileBrotherNames(apiUrlCreator);

	for (const file of files) {
		const filePath = new Path(file.name);
		const newName = fileNameUtils.getNewName(names, filePath.name, filePath.extension);
		const res = await FetchService.fetch(
			apiUrlCreator.setArticleResource(newName),
			await file.arrayBuffer(),
			filePath.extension && (MimeTypes[filePath.extension] ?? filePath.extension),
		);

		if (!res.ok) return;
		names.push(newName);
		const { from, to } = view.state.selection;
		const newFilePath = new Path(newName);
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
