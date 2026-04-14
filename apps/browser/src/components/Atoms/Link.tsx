import Url from "@core-ui/ApiServices/Types/Url";
import type { BaseLink } from "@ext/navigation/NavigationLinks";
import { forwardRef, type HTMLAttributes, type ReactNode, type RefObject } from "react";
import { Link, type LinkProps } from "wouter";

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
