import BranchData from "./BranchData";

export default interface Branch {
	toString(): string;
	compare(version: Branch): boolean;
	getData(): BranchData;
}
