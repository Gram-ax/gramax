import Url from "@core-ui/ApiServices/Types/Url";
import { CSSProperties, ReactChild } from "react";
import { useRouter } from "../../logic/Api/useRouter";
import Icon from "../Atoms/Icon";
import Link from "../Atoms/Link";

const Anchor = ({
	children,
	basePath,
	style = { fontWeight: 300 },
	target = "_blank",
	...props
}: {
	href: string;
	children: ReactChild;
	basePath?: string;
	className?: string;
	style?: CSSProperties;
	target?: "_self" | "_blank" | "_parent" | "_top";
}) => {
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
