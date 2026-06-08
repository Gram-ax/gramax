import resolveModule from "@app/resolveModule/frontend";
import type { BaseLink } from "@ext/navigation/NavigationLinks";
import { forwardRef, type HTMLAttributes, type ReactNode, type RefObject } from "react";

interface LinkProps extends HTMLAttributes<HTMLAnchorElement> {
	href: BaseLink;
	children: ReactNode;
	dataQa?: string;
	ensureLeadingSlash?: boolean;
}

const Link = forwardRef((props: LinkProps, ref: RefObject<HTMLAnchorElement>) => {
	const ExternalLink = resolveModule("Link");

	const { ensureLeadingSlash = true, ...rest } = props;
	const pathname = props.href.pathname;
	const newProps = {
		...rest,
		href: {
			...props.href,
			pathname:
				ensureLeadingSlash &&
				!pathname.startsWith("/") &&
				!pathname.startsWith("#") &&
				!pathname.startsWith("?")
					? `/${pathname}`
					: pathname,
		},
	};

	return <ExternalLink {...newProps} ref={ref} />;
});

export default Link;
