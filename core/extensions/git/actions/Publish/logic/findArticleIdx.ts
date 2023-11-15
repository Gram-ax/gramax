const findArticleIdx = (pathToFind: string, paths: string[]): number => {
	for (const [i, p] of paths.entries()) if (pathToFind === p) return i;
	return 0;
};

export default findArticleIdx;
