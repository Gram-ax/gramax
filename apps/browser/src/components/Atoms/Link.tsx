import Url from "@core-ui/ApiServices/Types/Url";
import { BaseLink } from "@ext/navigation/NavigationLinks";
import { HTMLAttributes, ReactNode, RefObject, forwardRef } from "react";
import { Link, useRouter } from "wouter";

interface BrowserLinkProps extends HTMLAttributes<HTMLAnchorElement> {
	href: BaseLink;
	children: ReactNode;
	dataQa?: string;
}

const BrowserLink = forwardRef((props: BrowserLinkProps, ref: RefObject<HTMLAnchorElement>) => {
	const { href, children, dataQa, ...otherProps } = props;
	const url = href ? Url.fromBasePath(href?.pathname, useRouter()?.base, href?.query) : null;

	return (
		<Link href={url.pathname} {...otherProps}>
			<a ref={ref} data-qa={dataQa} {...otherProps}>
				{children}
			</a>
		</Link>
	);
});

export default BrowserLink;
