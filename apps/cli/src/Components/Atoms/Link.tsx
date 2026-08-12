import Url from "@core-ui/ApiServices/Types/Url";
import useGetHref from "@core-ui/useGetHref";
import { forwardRef, type RefObject } from "react";
import { useRouter } from "wouter";
import { type WebLinkProps, WouterLink } from "../../../../web/src/components/Atoms/Link";

const getSameDocumentHash = (href: string) => {
	if (typeof window === "undefined") return;
	const current = new URL(window.location.href);
	const target = new URL(href, window.document.baseURI);
	const hash = target.hash;
	current.hash = "";
	target.hash = "";
	if (current.href === target.href) return hash;
};

const StaticLink = forwardRef((props: WebLinkProps, ref: RefObject<HTMLAnchorElement>) => {
	const { href, dataQa, ...otherProps } = props;
	const commonProps = { ...otherProps, ref, "data-qa": dataQa };

	const url = href ? Url.from(href) : null;
	const router = useRouter();
	const pathname = url?.toString();
	const finalPathname = router.base.endsWith("/") && pathname?.startsWith("/") ? pathname.substring(1) : pathname;

	const rawHash = getSameDocumentHash(finalPathname);
	const resolvedHash = useGetHref(rawHash ?? "");
	if (rawHash) return <a {...commonProps} href={resolvedHash} />;

	return <WouterLink {...commonProps} href={finalPathname} />;
});

export default StaticLink;
