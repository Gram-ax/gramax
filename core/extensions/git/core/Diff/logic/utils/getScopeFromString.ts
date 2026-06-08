const getScopeFromString = (scope: string) => {
	if (!scope) return null;
	if (scope === "HEAD") return "HEAD";
	if (scope.startsWith("commit-")) return { commit: scope.slice(7) };
	if (scope.startsWith("reference-")) return { reference: scope.slice(10) };

	console.error("Invalid scope string", scope);
	return null;
};

export default getScopeFromString;
