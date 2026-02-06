import { useRouter } from "@core/Api/useRouter";
import RouterPathProvider from "@core/RouterPath/RouterPathProvider";
import Url from "@core-ui/ApiServices/Types/Url";
import ArticleTooltipService from "@core-ui/ContextServices/ArticleTooltip";
import isMobileService from "@core-ui/ContextServices/isMobileService";
import { usePlatform } from "@core-ui/hooks/usePlatform";
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
	onClick?: (e: React.MouseEvent<HTMLAnchorElement>) => void;
	hideExternalLinkIcon?: boolean;
	hash?: string;
	isPrint?: boolean;
}

const Anchor = (Props: AnchorProps) => {
	const { children, basePath, onClick, target: propTarget = "_blank", resourcePath, ...props } = Props;
	const isAnchor = props.href?.match(/^#/);
	const basePathLength = typeof window === "undefined" ? 0 : (useRouter()?.basePath?.length ?? basePath?.length ?? 0);
	const { setLink } = ArticleTooltipService.value;
	const { isTauri } = usePlatform();
	const target = isTauri || props.href?.startsWith("gramax://") ? "_self" : propTarget;
	const isMobile = isMobileService.value;

	if (!isAnchor && props.href != null && props.href.slice(basePathLength + 1, basePathLength + 4) != "api") {
		const isExternal = props.href?.match(/^\w+:/);

		if (!isExternal) {
			const logicPath = RouterPathProvider.getLogicPath(props.href);
			const pdfHref = `#${logicPath}${props.hash ?? ""}`;

			return (
				<Link
					href={Url.from({ pathname: !props.isPrint ? props.href + (props.hash ?? "") : pdfHref })}
					onClick={onClick}
					onMouseEnter={
						isMobile
							? undefined
							: (event) => setLink(event.target as HTMLElement, resourcePath, props.hash, props.href)
					}
				>
					{children}
				</Link>
			);
		}

		return (
			<a {...props} rel="noopener" target={target}>
				{children}
				<span
					className={"external-link-wrapper"}
					data-mdignore={true}
					style={{ whiteSpace: "nowrap", padding: 0 }}
				>
					&#65279;
					<Icon className="link-icon" code="external-link" />
				</span>
			</a>
		);
	}

	return <a {...props}>{children}</a>;
};

export default Anchor;
