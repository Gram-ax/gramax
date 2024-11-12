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

	const newProps = {
		...props,
		href: {
			...props.href,
			pathname: props.href.pathname.startsWith("/") ? props.href.pathname : "/" + props.href.pathname,
		},
	};

	return <ExternalLink {...newProps} ref={ref} />;
});

export default Link;
