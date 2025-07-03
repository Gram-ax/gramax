import Url from "@core-ui/ApiServices/Types/Url";
import { BaseLink } from "@ext/navigation/NavigationLinks";
import { HTMLAttributes, ReactNode, RefObject, forwardRef } from "react";
import { Link, LinkProps, useRouter } from "wouter";

const WouterLink: (props: LinkProps & { ref: RefObject<HTMLAnchorElement> }) => ReactNode = Link;
interface BrowserLinkProps extends HTMLAttributes<HTMLAnchorElement> {
	href: BaseLink;
	children: ReactNode;
	dataQa?: string;
}

const BrowserLink = forwardRef((props: BrowserLinkProps, ref: RefObject<HTMLAnchorElement>) => {
	const { href, children, dataQa, ...otherProps } = props;
	const url = href ? Url.from(href) : null;
	const router = useRouter();
	const pathname = url?.pathname;
	const finalPathname = router.base.endsWith("/") && pathname?.startsWith("/") ? pathname.substring(1) : pathname;

	return (
		<WouterLink {...otherProps} ref={ref} data-qa={dataQa} href={finalPathname}>
			{children}
		</WouterLink>
	);
});

export default BrowserLink;
