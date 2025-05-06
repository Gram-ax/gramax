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
	const url = href ? Url.fromBasePath(href?.pathname, useRouter()?.base, href?.query) : null;

	return (
		<WouterLink {...otherProps} ref={ref} data-qa={dataQa} href={url.pathname}>
			{children}
		</WouterLink>
	);
});

export default BrowserLink;
