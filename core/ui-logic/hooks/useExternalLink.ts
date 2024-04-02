import isURL from "@core-ui/utils/isURL";
import { useCallback, useState } from "react";

const regex = /^(?!:\/\/)(?:(?:[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,}|localhost)(?:\/.*)?$/;

export const useExternalLink = (href: string): [boolean, string, (v: string) => void] => {
	const isUrl = isURL(href);
	const isDomain = regex.test(href);
	const [isExternalLink, setIsExternalLink] = useState(isUrl || isDomain);
	const [externalLink, setExternalLink] = useState(isDomain ? `https://${href}` : href);

	const updateLink: (v: string) => void = useCallback((value) => {
		const isUrl = isURL(value);
		const isDomain = regex.test(value);
		setExternalLink(isDomain ? `https://${value}` : value);
		setIsExternalLink(isUrl || isDomain);
	}, []);

	return [isExternalLink, externalLink, updateLink];
};
