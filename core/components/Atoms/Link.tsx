import resolveModule from "@app/resolveModule";
import PageDataContextService from "@core-ui/ContextServices/PageDataContext";
import React, { HTMLAttributes, ReactNode, RefObject } from "react";
import localizer from "../../extensions/localization/core/Localizer";
import { BaseLink } from "../../extensions/navigation/NavigationLinks";

const Link = (
	props: {
		href: BaseLink;
		children: ReactNode;
		dataQa?: string;
	} & HTMLAttributes<HTMLAnchorElement>,
	ref: RefObject<HTMLAnchorElement>,
) => {
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
};

export default React.forwardRef(Link);
