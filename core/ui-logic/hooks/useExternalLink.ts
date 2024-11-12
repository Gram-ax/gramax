import isURL from "@core-ui/utils/isURL";
import { useCallback, useState } from "react";

const regex = /^(?!:\/\/)(?:(?:[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,}|localhost)(?:\/.*)?$/;

const isExternalLink = (href: string) => {
	const isUrl = isURL(href);
	const isDomain = regex.test(href);

	const isExternal = isUrl || isDomain;

	return { isDomain, isUrl, isExternal };
};

const useExternalLink = (href: string): [boolean, string, (v: string) => void] => {
	const { isExternal, isDomain } = isExternalLink(href);
	const [isExternalLinkState, setIsExternalLink] = useState(isExternal);
	const [externalLink, setExternalLink] = useState(isDomain ? `https://${href}` : href);

	const updateLink: (v: string) => void = useCallback((value) => {
		const isUrl = isURL(value);
		const isDomain = regex.test(value);
		setExternalLink(isDomain ? `https://${value}` : value);
		setIsExternalLink(isUrl || isDomain);
	}, []);

	return [isExternalLinkState, externalLink, updateLink];
};

export { useExternalLink, isExternalLink };
