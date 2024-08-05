import resolveModule from "@app/resolveModule/frontend";
import { defaultLanguage } from "@ext/localization/core/model/Language";
import { BaseLink } from "@ext/navigation/NavigationLinks";
import { HTMLAttributes, ReactNode, RefObject, forwardRef } from "react";
import localizer from "../../extensions/localization/core/Localizer";

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
			pathname: localizer.addPrefix(props.href.pathname, defaultLanguage),
		},
	};
	return <ExternalLink {...newProps} ref={ref} />;
});

export default Link;
