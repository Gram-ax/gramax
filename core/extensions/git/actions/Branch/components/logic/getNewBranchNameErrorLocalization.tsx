import { NewBranchNameError } from "@ext/git/actions/Branch/components/logic/validateBranchError";
import Language from "@ext/localization/core/model/Language";
import useLocalize from "@ext/localization/useLocalize";

export default function getNewBranchNameErrorLocalization(key: NewBranchNameError, lang: Language) {
	const errors: Record<NewBranchNameError, string> = {
		[NewBranchNameError.HaveEncodingSymbolsError]: useLocalize("branchNameCanNotHaveEncodingSymbols", lang),
		[NewBranchNameError.HaveDotsSequenceAndLeadingDotError]: useLocalize(
			"branchNameCanNotHaveDotsSequenceAndLeadingDot",
			lang,
		),
		[NewBranchNameError.HaveDotAndSlashAtEndAndContainSequencesOfSlashesError]: useLocalize(
			"branchNameCanNotHaveDotAndSlashAtEndAndContainSequencesOfSlashes",
			lang,
		),
		[NewBranchNameError.IsReservedNamesError]: useLocalize("branchNameCanNotBeReservedNames", lang),
		[NewBranchNameError.AlreadyExistsError]: useLocalize("branchNameAlreadyExists", lang),
		[NewBranchNameError.HaveExistingPrefixBranchError]: useLocalize(
			"branchNameCanNotHaveExistingPrefixBranch",
			lang,
		),
		[NewBranchNameError.NotEndWithLockError]: useLocalize("branchNameNotEndWithLock", lang),
	};

	return errors[key];
}
