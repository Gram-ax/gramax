export default interface Version {
	toString(): string;
	compare(commit: Version): boolean;
}
