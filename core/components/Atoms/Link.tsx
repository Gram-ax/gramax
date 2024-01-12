import resolveModule from "@app/resolveModule";
import PageDataContextService from "@core-ui/ContextServices/PageDataContext";
import { HTMLAttributes, ReactNode, RefObject, forwardRef } from "react";
import localizer from "../../extensions/localization/core/Localizer";
import { BaseLink } from "@ext/navigation/NavigationLinks";

interface LinkProps extends HTMLAttributes<HTMLAnchorElement> {
	href: BaseLink;
	children: ReactNode;
	dataQa?: string;
}

const Link = forwardRef((props: LinkProps, ref: RefObject<HTMLAnchorElement>) => {
	const ExternalLink = resolveModule("Link");

	const lang = PageDataContextService.value?.lang;
	const newProps = {
		...props,
		href: {
			...props.href,
			pathname: localizer.addPrefix(props.href.pathname, lang),
		},
	};
	return <ExternalLink {...newProps} ref={ref} />;
});

export default Link;
