export enum NewBranchNameError {
	HaveEncodingSymbolsError = "HaveEncodingSymbolsError",
	HaveDotsSequenceAndLeadingDotError = "HaveDotsSequenceAndLeadingDotError",
	HaveDotAndSlashAtEndAndContainSequencesOfSlashesError = "HaveDotAndSlashAtEndAndContainSequencesOfSlashesError",
	IsReservedNamesError = "IsReservedNamesError",
	AlreadyExistsError = "AlreadyExistsError",
	HaveExistingPrefixBranchError = "HaveExistingPrefixBranchError",
	NotEndWithLockError = "NotEndWithLockError",
}

const validateBranchError = (value: string, branches: string[]): NewBranchNameError => {
	value = value.toLowerCase();
	const branchesToLowerCase = branches.map((b) => b.toLowerCase());

	if (/[\s*?[\]~:"<>|^\\]/m.test(value)) return NewBranchNameError.HaveEncodingSymbolsError;
	if (value.startsWith(".") || value.includes("..")) return NewBranchNameError.HaveDotsSequenceAndLeadingDotError;
	if (value.includes("//") || /[/.]$/.test(value))
		return NewBranchNameError.HaveDotAndSlashAtEndAndContainSequencesOfSlashesError;
	if (value === "head") return NewBranchNameError.IsReservedNamesError;
	if (branchesToLowerCase.includes(value)) return NewBranchNameError.AlreadyExistsError;
	if (isHavePrefixInNewBranch(value, branchesToLowerCase)) return NewBranchNameError.HaveExistingPrefixBranchError;
	if (/.lock$/.test(value)) return NewBranchNameError.NotEndWithLockError;

	return null;
};

const isHavePrefixInNewBranch = (value: string, branches: string[]): boolean => {
	for (const branch of branches) {
		const isExistingPrefixOfNew = value.startsWith(branch + "/");
		const isNewPrefixOfExisting = branch.startsWith(value + "/");
		if (value === branch || isExistingPrefixOfNew || isNewPrefixOfExisting) {
			return true;
		}
	}
	return false;
};

export default validateBranchError;
