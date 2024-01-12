import ApiUrlCreator from "@core-ui/ApiServices/ApiUrlCreator";
import { EditorView } from "prosemirror-view";
import { ArticleProps } from "../../../../../../logic/SitePresenter/SitePresenter";
import createImages from "./createImages";

const getHtmlImageUrl = (html: string): string => {
	const regExp = /<img[^>]*src=["']?([^"'\s>]+)/g;
	let result;
	while ((result = regExp.exec(html))) {
		return result[1];
	}
};

const imageHandlePaste = (
	view: EditorView,
	event: ClipboardEvent,
	articleProps: ArticleProps,
	apiUrlCreator: ApiUrlCreator,
) => {
	if (!event.clipboardData.items.length) return;

	let result = false;
	const item = event.clipboardData.items[0];
	if (item.type == "text/html") {
		// eslint-disable-next-line @typescript-eslint/no-misused-promises
		item.getAsString(async (data) => {
			const url = getHtmlImageUrl(data);
			if (!url) return;
			result = true;
			const response = await fetch(url);
			const type = response.headers.get("Content-Type");
			if (!type.startsWith("image")) return;
			const file = await response.blob();
			await createImages([file as File], view, articleProps, apiUrlCreator);
		});
	}
	if (item.type.startsWith("image")) {
		result = true;
		const file = item.getAsFile();
		void createImages([file], view, articleProps, apiUrlCreator);
	}
	return result;
};

export default imageHandlePaste;
