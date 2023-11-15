import Url from "@core-ui/ApiServices/Types/Url";
import { useRouter } from "@core/Api/useRouter";
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
	}: {
		href: BaseLink;
		children: ReactNode;
		onClick?: () => void;
		onMouseOver?: () => void;
		className?: string;
	},
	ref: RefObject<HTMLAnchorElement>,
) => {
	const url = href ? Url.fromBasePath(href?.pathname, useRouter().basePath, href?.query) : null;

	return (
		<Link href={url} scroll={true} passHref>
			<a ref={ref} onClick={onClick} className={className} onMouseOver={onMouseOver}>
				{children}
			</a>
		</Link>
	);
};

export default React.forwardRef(NextLink);
