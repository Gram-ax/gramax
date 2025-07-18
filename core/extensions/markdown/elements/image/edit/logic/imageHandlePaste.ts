import createImages from "@ext/markdown/elements/image/edit/logic/createImages";
import { EditorView } from "prosemirror-view";
import { ResourceServiceType } from "@ext/markdown/elements/copyArticles/resourceService";

const imageHandlePaste = (
	view: EditorView,
	event: ClipboardEvent,
	fileName: string,
	resourceService: ResourceServiceType,
) => {
	if (event.clipboardData.files.length == 0) return false;
	const hasPlainText = event.clipboardData.getData("text/plain");
	const hasHtml = event.clipboardData.getData("text/html");

	if (hasPlainText && hasHtml) return false;

	for (const item of event.clipboardData.items) {
		if (item.type.startsWith("image")) {
			const file = item.getAsFile();
			if (!file) continue;
			void createImages([file], view, fileName, resourceService);
			return true;
		}
	}
};

export default imageHandlePaste;
