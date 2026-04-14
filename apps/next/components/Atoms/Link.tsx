import Url from "@core-ui/ApiServices/Types/Url";
import type { BaseLink } from "@ext/navigation/NavigationLinks";
import Link from "next/link";
import React, { type HTMLAttributes, type ReactNode, type RefObject } from "react";

interface NextLinkProps extends HTMLAttributes<HTMLAnchorElement> {
	href: BaseLink;
	children: ReactNode;
	dataQa?: string;
}

const NextLink = (props: NextLinkProps, ref: RefObject<HTMLAnchorElement>) => {
	const { href, children, onClick, dataQa, ...otherProps } = props;
	const url = href ? Url.from({ pathname: decodeURI(href.pathname), query: href?.query }) : null;

	return (
		<Link
			data-qa={dataQa}
			href={url?.toString()}
			onClick={onClick}
			passHref
			ref={ref}
			scroll={true}
			{...otherProps}
		>
			{children}
		</Link>
	);
};

export default React.forwardRef(NextLink);
