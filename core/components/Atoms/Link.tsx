import resolveModule from "@app/resolveModule/frontend";
import { BaseLink } from "@ext/navigation/NavigationLinks";
import { HTMLAttributes, ReactNode, RefObject, forwardRef } from "react";

interface LinkProps extends HTMLAttributes<HTMLAnchorElement> {
	href: BaseLink;
	children: ReactNode;
	dataQa?: string;
}

const Link = forwardRef((props: LinkProps, ref: RefObject<HTMLAnchorElement>) => {
	const ExternalLink = resolveModule("Link");

	const pathname = props.href.pathname;
	const newProps = {
		...props,
		href: {
			...props.href,
			pathname: pathname.startsWith("/") || pathname.startsWith("#") ? pathname : "/" + pathname,
		},
	};

	return <ExternalLink {...newProps} ref={ref} />;
});

export default Link;
