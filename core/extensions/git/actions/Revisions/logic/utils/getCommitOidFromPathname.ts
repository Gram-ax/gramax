const getCommitOidFromPathname = (pathname: string) => {
	return pathname?.match(/commit-([a-f0-9]+)/)?.[1];
};

export default getCommitOidFromPathname;
