import Icon from "@components/Atoms/Icon";
import styled from "@emotion/styled";
import React from "react";
import ArticlePropsService from "@core-ui/ContextServices/ArticleProps";

const Header = styled(
	({
		level,
		id,
		children,
		className,
		dataQa,
	}: {
		level: number;
		id?: string;
		children?: any;
		className?: string;
		dataQa?: string;
		props?: any;
	}) => {
		const articleProps = ArticlePropsService?.value;
		const logicPath = articleProps?.path ?? "";
		const href = "#" + (id ?? "");
		const header = (
			<>
				{children}
				<a
					href={href}
					className="anchor"
					data-mdignore={true}
					contentEditable={false}
					onClick={() => {
						navigator.clipboard.writeText(
							window.location.protocol + "//" + window.location.host + "/" + logicPath + href,
						);
					}}
				>
					<Icon code="link" />
				</a>
			</>
		);
		return React.createElement("h" + level, { id, className, "data-qa": dataQa }, header);
	},
)`
	:hover > a.anchor {
		opacity: 0.5;
	}
	:hover > a.anchor:hover {
		opacity: 1;
	}

	> a.anchor {
		opacity: 0;
		font-size: 0.9em;
		line-height: inherit;
		margin-left: var(--distance-i-span);
		color: var(--color-article-text) !important;
	}

	sup {
		a.anchor {
			font-weight: inherit;
			color: var(--color-link);
		}
	}
`;

export default Header;
