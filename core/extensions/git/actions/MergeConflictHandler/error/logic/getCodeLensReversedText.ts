import { CodeLensText } from "@ext/git/actions/MergeConflictHandler/Monaco/logic/FileInputMergeConflict";
import t from "@ext/localization/locale/translate";

const getCodeLensReversedText = (): CodeLensText => {
	return {
		acceptCurrent: t("git.merge.conflict.accept-incoming-change"),
		currentTextAfter: t("git.merge.conflict.incoming-change"),
		acceptIncoming: t("git.merge.conflict.accept-current-change"),
		incomingTextAfter: t("git.merge.conflict.current-change"),
		acceptBoth: t("git.merge.conflict.accept-both"),
		mergeWithDeletionHeader: t("git.merge.conflict.default-with-deletion-text"),
		deleteFile: t("delete"),
		leaveFile: t("git.merge.conflict.leave"),
		mergeWithDeletionFileContent: t("file-content"),
	};
};

export default getCodeLensReversedText;
