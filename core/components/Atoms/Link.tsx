import resolveModule from "@app/resolveModule/frontend";
import Url from "@core-ui/ApiServices/Types/Url";
import { parseLinkHref } from "@core-ui/utils/parseLinkhref";
import type { BaseLink } from "@ext/navigation/NavigationLinks";
import { forwardRef, type HTMLAttributes, type ReactNode, type RefObject } from "react";

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
			pathname: parseLinkHref(Url.from(props.href)),
		},
	};

	return <ExternalLink {...newProps} ref={ref} />;
});

export default Link;
