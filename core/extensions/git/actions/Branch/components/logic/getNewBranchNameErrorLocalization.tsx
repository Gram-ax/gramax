import { NewBranchNameError } from "@ext/git/actions/Branch/components/logic/validateBranchError";
import t from "@ext/localization/locale/translate";

export default function getNewBranchNameErrorLocalization(key: NewBranchNameError) {
	const errors: Record<NewBranchNameError, string> = {
		[NewBranchNameError.HaveEncodingSymbolsError]: t("branch-name-can-not-have-encoding-symbols"),
		[NewBranchNameError.HaveDotsSequenceAndLeadingDotError]: t(
			"branch-name-can-not-have-dots-sequence-and-leading-dot",
		),
		[NewBranchNameError.HaveDotAndSlashAtEndAndContainSequencesOfSlashesError]: t(
			"branch-name-can-not-have-dot-and-slash-at-end-and-contain-sequences-of-slashes",
		),
		[NewBranchNameError.IsReservedNamesError]: t("branch-name-can-not-be-reserved-names"),
		[NewBranchNameError.AlreadyExistsError]: t("branch-name-already-exists"),
		[NewBranchNameError.HaveExistingPrefixBranchError]: t("branch-name-can-not-have-existing-prefix-branch"),
		[NewBranchNameError.NotEndWithLockError]: t("branch-name-not-end-with-lock"),
	};

	return errors[key];
}
