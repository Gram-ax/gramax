import { deepEqual } from "@ext/enterprise/utils/deepEqual";

export const changedList = (isAdd: boolean, modified: string[], original: string[]) =>
	isAdd ? modified.length > 0 : !deepEqual(modified, original);
