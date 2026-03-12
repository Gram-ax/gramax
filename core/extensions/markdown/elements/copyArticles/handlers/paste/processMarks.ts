import type ApiUrlCreator from "@core-ui/ApiServices/ApiUrlCreator";
import FetchService from "@core-ui/ApiServices/FetchService";
import type { GramaxClipboardData } from "@ext/markdown/elements/copyArticles/handlers/copy";
import type { Mark } from "@tiptap/pm/model";

interface ProcessMarksProps {
	marks: Mark[] | readonly Mark[];
	apiUrlCreator: ApiUrlCreator;
	copyData: GramaxClipboardData;
	existedComments: string[];
	isStorageConnected: boolean;
}

interface MarkHandler {
	mark: Mark;
	apiUrlCreator: ApiUrlCreator;
	copyData: GramaxClipboardData;
	existedComments: string[];
	isStorageConnected: boolean;
}

type MarkHandlerFunction = (handler: MarkHandler) => Promise<Mark>;

export const copyCommentIfNeed = async (
	id: string,
	apiUrlCreator: ApiUrlCreator,
	copyData: GramaxClipboardData,
): Promise<boolean> => {
	const res = await FetchService.fetch(apiUrlCreator.copyComment(id, copyData.copyPath));
	if (!res.ok) return false;
	return await res.json();
};

const createLinkIfNeed = async (link: string, apiUrlCreator: ApiUrlCreator) => {
	if (!link) return;
	const res = await FetchService.fetch(apiUrlCreator.createLinkFromHref(link));
	if (!res.ok) return;
	return await res.json();
};

const handleLink: MarkHandlerFunction = async ({ mark, apiUrlCreator }) => {
	if (mark.type.name !== "link") return mark;
	const newLink = await createLinkIfNeed(mark.attrs.href, apiUrlCreator);
	if (!newLink) return mark;
	return mark.type.create(newLink);
};

const handleComment: MarkHandlerFunction = async ({ mark, apiUrlCreator, copyData }) => {
	if (mark.type.name !== "comment") return mark;
	const newComment = await copyCommentIfNeed(mark.attrs.id, apiUrlCreator, copyData);
	if (!newComment) return mark;
	return mark.type.create({ id: mark.attrs.id });
};

export const processMarks = async (props: ProcessMarksProps): Promise<Mark[] | readonly Mark[]> => {
	const { marks, apiUrlCreator, copyData, existedComments, isStorageConnected } = props;
	const handlers: MarkHandlerFunction[] = [handleLink, handleComment];
	const newMarks: Mark[] = [];

	for (const mark of marks) {
		let replaced = false;
		for (const handler of handlers) {
			const newMark = await handler({ mark, apiUrlCreator, copyData, existedComments, isStorageConnected });
			if (!newMark) continue;
			if (newMark !== mark) {
				newMarks.push(newMark);
				replaced = true;
				break;
			}
		}
		if (!replaced) newMarks.push(mark);
	}

	return newMarks;
};
