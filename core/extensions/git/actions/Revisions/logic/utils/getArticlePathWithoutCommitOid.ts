export const getArticlePathWithoutCommitOid = (pathname: string): string => {
	return pathname.replace(/[:~](commit-[a-f0-9]+|dif-[a-f0-9]{40}-[a-f0-9]{40})(\/|$)/, "$2");
};
