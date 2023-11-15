import Url from "@core-ui/ApiServices/Types/Url";
import { BaseLink } from "@ext/navigation/NavigationLinks";
import React, { ReactNode, RefObject } from "react";
import { Link, useRouter } from "wouter";

const BrowserLink = (
	{
		href,
		children,
		dataQa,
		onClick,
		onMouseOver,
		className,
	}: {
		href: BaseLink;
		children: ReactNode;
		dataQa?: string;
		onClick?: () => void;
		onMouseOver?: () => void;
		className?: string;
	},
	ref: RefObject<HTMLAnchorElement>,
) => {
	const url = href ? Url.fromBasePath(href?.pathname, useRouter()?.base, href?.query) : null;
	return (
		<Link href={url.toString()}>
			<a
				ref={ref}
				data-qa={dataQa}
				onClick={onClick}
				onMouseOver={onMouseOver}
				onContextMenu={(e) => e.preventDefault()}
				className={className}
			>
				{children}
			</a>
		</Link>
	);
};

export default React.forwardRef(BrowserLink);
