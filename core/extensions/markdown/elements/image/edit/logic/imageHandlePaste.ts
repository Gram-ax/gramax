import ApiUrlCreator from "@core-ui/ApiServices/ApiUrlCreator";
import createImages from "@ext/markdown/elements/image/edit/logic/createImages";
import { EditorView } from "prosemirror-view";
import { ClientArticleProps } from "../../../../../../logic/SitePresenter/SitePresenter";

const imageHandlePaste = (
	view: EditorView,
	event: ClipboardEvent,
	articleProps: ClientArticleProps,
	apiUrlCreator: ApiUrlCreator,
) => {
	if (event.clipboardData.files.length == 0) return false;
	for (const item of event.clipboardData.items) {
		if (item.type == "text/rtf") return false;
		if (item.type.startsWith("image")) {
			const file = item.getAsFile();
			if (!file) continue;
			void createImages([file], view, articleProps, apiUrlCreator);
			return true;
		}
	}
};

export default imageHandlePaste;
