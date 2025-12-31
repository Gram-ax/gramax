import Url from "@core-ui/ApiServices/Types/Url";
import useGetHref from "@core-ui/useGetHref";
import { BrowserLinkProps, WouterLink } from "../../../../browser/src/components/Atoms/Link";
import { RefObject, forwardRef } from "react";
import { useRouter } from "wouter";

const getHashIfSameDocument = (href: string) => {
	if (typeof window === "undefined") return;
	const current = new URL(window.location.href);
	const target = new URL(href, window.document.baseURI);
	const hash = target.hash;
	current.hash = "";
	target.hash = "";
	if (current.href === target.href) return useGetHref(hash);
};

const StaticLink = forwardRef((props: BrowserLinkProps, ref: RefObject<HTMLAnchorElement>) => {
	const { href, dataQa, ...otherProps } = props;
	const commonProps = { ...otherProps, ref, "data-qa": dataQa };

	const url = href ? Url.from(href) : null;
	const router = useRouter();
	const pathname = url?.toString();
	const finalPathname = router.base.endsWith("/") && pathname?.startsWith("/") ? pathname.substring(1) : pathname;

	const hash = getHashIfSameDocument(finalPathname);
	if (hash) return <a {...commonProps} href={hash} />;

	return <WouterLink {...commonProps} href={finalPathname} />;
});

export default StaticLink;
