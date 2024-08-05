function isObject(item: any): boolean {
	return item && typeof item === "object" && !Array.isArray(item);
}

function mergeObjects<T = any>(target: object, source: object): T {
	function recursiveMerge(t: any, s: any): any {
		const result = Array.isArray(t) ? [] : {};

		for (const key in t) {
			if (Object.prototype.hasOwnProperty.call(t, key)) {
				if (isObject(t[key])) {
					result[key] = recursiveMerge(t[key], {});
				} else {
					result[key] = t[key];
				}
			}
		}

		for (const key in s) {
			if (Object.prototype.hasOwnProperty.call(s, key)) {
				if (isObject(s[key])) {
					if (result[key] !== undefined) {
						result[key] = recursiveMerge(result[key], s[key]);
					} else {
						result[key] = recursiveMerge({}, s[key]);
					}
				} else {
					result[key] = s[key];
				}
			}
		}

		return result;
	}

	return recursiveMerge(target, source) as T;
}

export default mergeObjects;
