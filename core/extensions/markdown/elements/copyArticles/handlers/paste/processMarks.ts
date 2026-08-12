import type ApiUrlCreator from "@core-ui/ApiServices/ApiUrlCreator";
import FetchService from "@core-ui/ApiServices/FetchService";
import type { CommentBlock } from "@core-ui/CommentBlock";
import { getEditorStore } from "@core-ui/stores/EditorStore";
import type { GramaxClipboardData } from "@ext/markdown/elements/copyArticles/handlers/copy";
import type { Mark } from "@tiptap/pm/model";

export class PastedComments {
	private _restored = new Map<string, string>();

	restoredAs(id: string) {
		return this._restored.get(id);
	}

	take(id: string, newId: string) {
		this._restored.set(id, newId);
	}
}

interface ProcessMarksProps {
	marks: Mark[] | readonly Mark[];
	apiUrlCreator: ApiUrlCreator;
	copyData: GramaxClipboardData;
	comments: PastedComments;
	isStorageConnected: boolean;
}

interface MarkHandler {
	mark: Mark;
	apiUrlCreator: ApiUrlCreator;
	copyData: GramaxClipboardData;
	comments: PastedComments;
	isStorageConnected: boolean;
}

type MarkHandlerFunction = (handler: MarkHandler) => Promise<Mark | null>;

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

const getNewCommentId = async (apiUrlCreator: ApiUrlCreator): Promise<string> => {
	const res = await FetchService.fetch(apiUrlCreator.getNewCommentId());
	if (!res.ok) return null;
	return await res.text();
};

const cacheComment = (id: string, comment: CommentBlock) => {
	if (!comment) return;
	getEditorStore().editor?.storage?.comment?.comments?.set(id, comment);
};

const saveComment = async (id: string, comment: CommentBlock, apiUrlCreator: ApiUrlCreator): Promise<boolean> => {
	const res = await FetchService.fetch(apiUrlCreator.updateComment(id), JSON.stringify(comment));
	if (!res.ok) return false;

	cacheComment(id, comment);
	return true;
};

export interface RestoreCommentProps {
	id: string;
	apiUrlCreator: ApiUrlCreator;
	copyData: GramaxClipboardData;
	comments: PastedComments;
	isStorageConnected: boolean;
}

export const restoreComment = async (props: RestoreCommentProps): Promise<string> => {
	const { id, apiUrlCreator, copyData, comments, isStorageConnected } = props;
	// Comments need a storage to live in — pasting into an article without one drops them.
	if (!isStorageConnected) return null;

	// Another node of this same paste already recreated this comment: point at it rather than fork a copy.
	const restored = comments.restoredAs(id);
	if (restored) return restored;

	const data = copyData.comments?.[id];
	if (!data?.comment) return null;

	const newId = await getNewCommentId(apiUrlCreator);
	if (!newId || !(await saveComment(newId, data, apiUrlCreator))) return null;

	comments.take(id, newId);
	return newId;
};

const handleComment: MarkHandlerFunction = async (props) => {
	const { mark } = props;
	if (mark.type.name !== "comment") return mark;

	const id = await restoreComment({ ...props, id: mark.attrs.id });
	if (!id) return null;

	return mark.type.create({ id });
};

export const processMarks = async (props: ProcessMarksProps): Promise<Mark[] | readonly Mark[]> => {
	const { marks, apiUrlCreator, copyData, comments, isStorageConnected } = props;
	const handlers: MarkHandlerFunction[] = [handleLink, handleComment];
	const newMarks: Mark[] = [];

	for (const mark of marks) {
		let handled = false;

		for (const handler of handlers) {
			const newMark = await handler({ mark, apiUrlCreator, copyData, comments, isStorageConnected });
			if (newMark === mark) continue;

			if (newMark) newMarks.push(newMark);
			handled = true;
			break;
		}

		if (!handled) newMarks.push(mark);
	}

	return newMarks;
};
