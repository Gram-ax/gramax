import Url from "@core-ui/ApiServices/Types/Url";
import { getStickyParams } from "@core-ui/utils/stickyQueryParams";
import type { BaseLink } from "@ext/navigation/NavigationLinks";
import { forwardRef, type HTMLAttributes, type ReactNode, type RefObject } from "react";
import { Link, type LinkProps } from "wouter";

export const WouterLink: (props: LinkProps & { ref: RefObject<HTMLAnchorElement> }) => ReactNode = Link;
export interface WebLinkProps extends HTMLAttributes<HTMLAnchorElement> {
	href: BaseLink;
	children: ReactNode;
	dataQa?: string;
}

const WebLink = forwardRef((props: WebLinkProps, ref: RefObject<HTMLAnchorElement>) => {
	const { href, dataQa, ...otherProps } = props;
	const pathname = href ? href.pathname : null;
	const preserved = getStickyParams(pathname ?? "");
	const url = href ? Url.from({ ...href, query: { ...preserved, ...href.query } }) : null;
	return <WouterLink {...otherProps} data-qa={dataQa} href={url?.toString()} ref={ref} />;
});

export default WebLink;
