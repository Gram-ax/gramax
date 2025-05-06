import Url from "@core-ui/ApiServices/Types/Url";
import { BaseLink } from "@ext/navigation/NavigationLinks";
import React, { HTMLAttributes, ReactNode, RefObject } from "react";
import { Link } from "react-router-dom";

interface CliLinkProps extends HTMLAttributes<HTMLAnchorElement> {
	href: BaseLink;
	children: ReactNode;
	dataQa?: string;
}

const CliLink = (props: CliLinkProps, ref: RefObject<HTMLAnchorElement>) => {
	const { href, children, onClick, dataQa, ...otherProps } = props;
	const url = href ? Url.from({ pathname: href?.pathname, query: href?.query }) : null;
	const [baseUrl, ...hash] = url.toString().split("#");
	return (
		<Link ref={ref} to={[decodeURI(baseUrl), ...hash].join("#")} onClick={onClick} data-qa={dataQa} {...otherProps}>
			{children}
		</Link>
	);
};

export default React.forwardRef(CliLink);
