if (!Array.prototype.at) {
	Array.prototype.at = function (index) {
		const len = this.length;
		const relativeIndex = index < 0 ? len + index : index;
		if (relativeIndex < 0 || relativeIndex >= len) return undefined;
		return this[relativeIndex];
	};
}

if (!Object.hasOwn) {
	Object.hasOwn = Object.prototype.hasOwnProperty;
}
