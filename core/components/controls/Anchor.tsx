import Url from "@core-ui/ApiServices/Types/Url";
import { CSSProperties, ReactNode } from "react";
import { useRouter } from "@core/Api/useRouter";
import Icon from "../Atoms/Icon";
import Link from "../Atoms/Link";

interface AnchorProps {
	href: string;
	children?: ReactNode;
	basePath?: string;
	className?: string;
	style?: CSSProperties;
	target?: "_self" | "_blank" | "_parent" | "_top";
	hideExternalLinkIcon?: boolean;
}
const Anchor = (Props: AnchorProps) => {
	const { children, basePath, target = "_blank", style = { fontWeight: 300 }, ...props } = Props;

	const isAnchor = props.href?.match(/^#/);
	const basePathLength = useRouter()?.basePath?.length ?? basePath?.length ?? 0;
	if (!isAnchor && props.href != null && props.href.slice(basePathLength + 1, basePathLength + 4) != "api") {
		const isExternal = props.href?.match(/^\w+:/);
		if (!isExternal) {
			return <Link href={Url.from({ pathname: props.href })}>{children}</Link>;
		}

		return (
			<a {...props} target={target} rel="noopener">
				{children}
				<span style={{ whiteSpace: "nowrap", padding: 0 }} data-mdignore={true}>
					&#65279;
					<Icon prefix="fal" className="linkIcon" code="external-link" style={style} />
				</span>
			</a>
		);
	}
	return <a {...props}>{children}</a>;
};

export default Anchor;
