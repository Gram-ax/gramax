import validateBranchError, { NewBranchNameError } from "../validateBranchError";

describe("validateBranchError проверяет", () => {
	const branches = ["branch1", "branch2/big"];

	test("корректную строку", () => {
		const result = validateBranchError("branch-name", branches);

		expect(result).toEqual(null);
	});

	test("строку со специальными символами", () => {
		const result1 = validateBranchError("/branch-name ", branches);
		const result2 = validateBranchError("branch[]name", branches);

		expect(result1).toEqual(NewBranchNameError.HaveEncodingSymbolsError);
		expect(result2).toEqual(NewBranchNameError.HaveEncodingSymbolsError);
	});

	test('строку, которая начинается с "." или содержит последовательности точек', () => {
		const result1 = validateBranchError(".branch-name", branches);
		const result2 = validateBranchError("branch..name", branches);

		expect(result1).toEqual(NewBranchNameError.HaveDotsSequenceAndLeadingDotError);
		expect(result2).toEqual(NewBranchNameError.HaveDotsSequenceAndLeadingDotError);
	});

	test('строку, которая заканчивается на "/" или ".", или также содержит последовательности "//".', () => {
		const result1 = validateBranchError("branch-name/", branches);
		const result2 = validateBranchError("branch-name.", branches);
		const result3 = validateBranchError("branch//name", branches);

		expect(result1).toEqual(NewBranchNameError.HaveDotAndSlashAtEndAndContainSequencesOfSlashesError);
		expect(result2).toEqual(NewBranchNameError.HaveDotAndSlashAtEndAndContainSequencesOfSlashesError);
		expect(result3).toEqual(NewBranchNameError.HaveDotAndSlashAtEndAndContainSequencesOfSlashesError);
	});

	test("строку, которая равна HEAD", () => {
		const result1 = validateBranchError("head", branches);
		const result2 = validateBranchError("HEAD", branches);

		expect(result1).toEqual(NewBranchNameError.IsReservedNamesError);
		expect(result2).toEqual(NewBranchNameError.IsReservedNamesError);
	});

	test("строку, которая уже есть в branches", () => {
		const result1 = validateBranchError("BRANCH1", branches);
		const result2 = validateBranchError("branch1", branches);

		expect(result1).toEqual(NewBranchNameError.AlreadyExistsError);
		expect(result2).toEqual(NewBranchNameError.AlreadyExistsError);
	});

	test("строку, которая содержит префикс или сама является префиксом для элементов branches", () => {
		const result1 = validateBranchError("BRANCH2", branches);
		const result2 = validateBranchError("branch1/big-branch", branches);

		expect(result1).toEqual(NewBranchNameError.HaveExistingPrefixBranchError);
		expect(result2).toEqual(NewBranchNameError.HaveExistingPrefixBranchError);
	});

	test('строку, которая заканчивается на ".lock"', () => {
		const result = validateBranchError("branch-name.lock", branches);

		expect(result).toEqual(NewBranchNameError.NotEndWithLockError);
	});
});
