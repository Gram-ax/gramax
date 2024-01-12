import parseStorageUrl from "@core/utils/parseStorageUrl";
import { useState, useCallback } from "react";

export const useExternalLink = (href: string) => {
	const parse = (props) => (parseStorageUrl(props)?.domain ? props : null);
	const [externalLink, setExternalLink] = useState(parse(href));

	const updateLink: (v: string) => void = useCallback((value) => setExternalLink(parse(value)), []);
	const isExternalLink = Boolean(parseStorageUrl(externalLink)?.domain);

	return { externalLink, isExternalLink, updateLink };
};
