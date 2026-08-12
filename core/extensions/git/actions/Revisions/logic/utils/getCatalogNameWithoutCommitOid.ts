const getCatalogNameWithoutCommitOid = (catalogName: string): string => {
	return catalogName?.replace(/[:~](commit-[a-f0-9]+|dif-[a-f0-9]{40}-[a-f0-9]{40})$/, "") ?? catalogName;
};

export default getCatalogNameWithoutCommitOid;
