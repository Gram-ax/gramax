type AliasRedirectProps = {
	aliasedFrom?: string;
	pathname?: string;
	errorCode?: number;
};

type PageQuery = Record<string, string | string[] | undefined> | URLSearchParams;

// Next passes `query` merging the [[...path]] route segments with the reader's
// search params — everything except `path` is the search string to carry over.
// Docportal passes the request's URLSearchParams as-is.
const getSearchString = (query: PageQuery) => {
	const params = new URLSearchParams();
	const entries = query instanceof URLSearchParams ? query.entries() : Object.entries(query);
	for (const [key, value] of entries) {
		if (key === "path" || value == null) continue;
		for (const part of Array.isArray(value) ? value : [value]) params.append(key, part);
	}
	const search = params.toString();
	return search ? `?${search}` : "";
};

export const getAliasRedirect = (articleProps: AliasRedirectProps, query: PageQuery) => {
	if (!articleProps?.aliasedFrom || !articleProps.pathname || articleProps.errorCode) return null;
	return {
		destination: `/${articleProps.pathname}${getSearchString(query)}`,
		statusCode: 302 as const,
	};
};
