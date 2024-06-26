import Url from "@core-ui/ApiServices/Types/Url";
import { BaseLink } from "@ext/navigation/NavigationLinks";
import Link from "next/link";
import React, { ReactNode, RefObject, HTMLAttributes } from "react";

interface NextLinkProps extends HTMLAttributes<HTMLAnchorElement> {
	href: BaseLink;
	children: ReactNode;
	dataQa?: string;
}

const NextLink = (props: NextLinkProps, ref: RefObject<HTMLAnchorElement>) => {
	const { href, children, onClick, dataQa, ...otherProps } = props;
	const url = href ? Url.from({ pathname: href?.pathname, query: href?.query }) : null;

	return (
		<Link href={decodeURI(url.toString())} scroll={true} passHref>
			<a ref={ref} onClick={onClick} data-qa={dataQa} {...otherProps}>
				{children}
			</a>
		</Link>
	);
};

export default React.forwardRef(NextLink);
