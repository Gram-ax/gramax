import Url from "@core-ui/ApiServices/Types/Url";
import { BaseLink } from "@ext/navigation/NavigationLinks";
import Link from "next/link";
import React, { ReactNode, RefObject } from "react";

const NextLink = (
	{
		href,
		children,
		onClick,
		className,
		onMouseOver,
		dataQa,
	}: {
		href: BaseLink;
		children: ReactNode;
		onClick?: () => void;
		onMouseOver?: () => void;
		className?: string;
		dataQa?: string;
	},
	ref: RefObject<HTMLAnchorElement>,
) => {
	const url = href ? Url.from({ pathname: href?.pathname, query: href?.query }) : null;

	return (
		<Link href={url} scroll={true} passHref>
			<a ref={ref} onClick={onClick} className={className} onMouseOver={onMouseOver} data-qa={dataQa}>
				{children}
			</a>
		</Link>
	);
};

export default React.forwardRef(NextLink);
