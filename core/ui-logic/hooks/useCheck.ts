import { useMemo } from "react";

function deepEqual(obj1: any, obj2: any) {
	if (obj1 === obj2) return true;
	if (typeof obj1 !== "object" || typeof obj2 !== "object" || obj1 === null || obj2 === null) {
		return false;
	}
	const keys1 = Object.keys(obj1);
	const keys2 = Object.keys(obj2);
	if (keys1.length !== keys2.length) return false;
	for (const key of keys1) {
		if (!keys2.includes(key) || !deepEqual(obj1[key], obj2[key])) {
			return false;
		}
	}

	return true;
}

const useCheck = (settings: any, newSettings: any) => {
	return useMemo(() => deepEqual(settings, newSettings), [settings, newSettings]);
};

export default useCheck;
