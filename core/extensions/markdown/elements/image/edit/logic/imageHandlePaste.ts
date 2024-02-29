import ApiUrlCreator from "@core-ui/ApiServices/ApiUrlCreator";
import { EditorView } from "prosemirror-view";
import { ClientArticleProps } from "../../../../../../logic/SitePresenter/SitePresenter";
import createImages from "./createImages";

const imageHandlePaste = (
	view: EditorView,
	event: ClipboardEvent,
	articleProps: ClientArticleProps,
	apiUrlCreator: ApiUrlCreator,
) => {
	if (event.clipboardData.files.length == 0) return false;
	for (const file of event.clipboardData.files) {
		if (!file.type.startsWith("image")) continue;
		void createImages([file], view, articleProps, apiUrlCreator);
		return true;
	}
	return false;
};

export default imageHandlePaste;
