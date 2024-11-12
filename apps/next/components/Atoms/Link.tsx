import Url from "@core-ui/ApiServices/Types/Url";
import { BaseLink } from "@ext/navigation/NavigationLinks";
import Link from "next/link";
import React, { HTMLAttributes, ReactNode, RefObject } from "react";

interface NextLinkProps extends HTMLAttributes<HTMLAnchorElement> {
	href: BaseLink;
	children: ReactNode;
	dataQa?: string;
}

const NextLink = (props: NextLinkProps, ref: RefObject<HTMLAnchorElement>) => {
	const { href, children, onClick, dataQa, ...otherProps } = props;
	const url = href ? Url.from({ pathname: href?.pathname, query: href?.query }) : null;


	return (
		<Link
			ref={ref}
			href={decodeURI(url.toString())}
			scroll={true}
			passHref
			onClick={onClick}
			data-qa={dataQa}
			{...otherProps}
		>
			{children}
		</Link>
	);
};

export default React.forwardRef(NextLink);
