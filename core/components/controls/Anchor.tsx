import Url from "@core-ui/ApiServices/Types/Url";
import ArticleTooltipService from "@core-ui/ContextServices/ArticleTooltip";
import { useRouter } from "@core/Api/useRouter";
import { ReactNode } from "react";
import Icon from "../Atoms/Icon";
import Link from "../Atoms/Link";

interface AnchorProps {
	href: string;
	resourcePath?: string;
	children?: ReactNode;
	basePath?: string;
	className?: string;
	target?: "_self" | "_blank" | "_parent" | "_top";
	hideExternalLinkIcon?: boolean;
}
const Anchor = (Props: AnchorProps) => {
	const { children, basePath, target = "_blank", resourcePath, ...props } = Props;
	const isAnchor = props.href?.match(/^#/);
	const basePathLength = useRouter()?.basePath?.length ?? basePath?.length ?? 0;
	const setLink = ArticleTooltipService.value;

	if (!isAnchor && props.href != null && props.href.slice(basePathLength + 1, basePathLength + 4) != "api") {
		const isExternal = props.href?.match(/^\w+:/);

		if (!isExternal) {
			return (
				<Link
					onMouseEnter={(event) => setLink(event.target as HTMLElement, resourcePath)}
					href={Url.from({ pathname: props.href })}
				>
					{children}
				</Link>
			);
		}

		return (
			<a {...props} target={target} rel="noopener">
				{children}
				<span style={{ whiteSpace: "nowrap", padding: 0 }} data-mdignore={true}>
					&#65279;
					<Icon className="linkIcon" code="external-link" />
				</span>
			</a>
		);
	}

	return <a {...props}>{children}</a>;
};

export default Anchor;
