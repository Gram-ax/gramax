import Url from "@core-ui/ApiServices/Types/Url";
import { BaseLink } from "@ext/navigation/NavigationLinks";
import { forwardRef, HTMLAttributes, ReactNode, RefObject } from "react";
import { Link, LinkProps } from "wouter";

export const WouterLink: (props: LinkProps & { ref: RefObject<HTMLAnchorElement> }) => ReactNode = Link;
export interface BrowserLinkProps extends HTMLAttributes<HTMLAnchorElement> {
	href: BaseLink;
	children: ReactNode;
	dataQa?: string;
}

const BrowserLink = forwardRef((props: BrowserLinkProps, ref: RefObject<HTMLAnchorElement>) => {
	const { href, dataQa, ...otherProps } = props;
	const url = href ? Url.from(href) : null;
	return <WouterLink {...otherProps} data-qa={dataQa} href={url?.toString()} ref={ref} />;
});

export default BrowserLink;
