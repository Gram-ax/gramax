const getCatalogNameWithoutCommitOid = (catalogName: string): string => {
	return catalogName?.replace(/[:~]commit-[a-f0-9]+$/, "") ?? catalogName;
};

export default getCatalogNameWithoutCommitOid;
