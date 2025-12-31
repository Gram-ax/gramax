import t from "@ext/localization/locale/translate";
import { DiffAstComment } from "@ext/markdown/elements/diff/logic/commentsDiff/CommentsDiff";
import { FileStatus } from "@ext/Watchers/model/FileStatus";

export const generateCommentTooltip = (comments: DiffAstComment[]): string => {
	const added = comments.filter((comment) => comment.type === FileStatus.new);
	const deleted = comments.filter((comment) => comment.type === FileStatus.delete);
	const modified = comments.filter((comment) => comment.type === FileStatus.modified);
	const totalLength = added.length + deleted.length + modified.length;

	if (totalLength === 1) {
		return t(`comments.diff.single.${added.length > 0 ? "added" : deleted.length > 0 ? "deleted" : "modified"}`);
	}

	return `${t("comments.diff.multiple.title")}.
    ${added.length > 0 ? `${t("comments.diff.multiple.added")}: ${added.length}` : ""}
    ${modified.length > 0 ? `${t("comments.diff.multiple.modified")}: ${modified.length}` : ""}
    ${deleted.length > 0 ? `${t("comments.diff.multiple.deleted")}: ${deleted.length}` : ""}`;
};
