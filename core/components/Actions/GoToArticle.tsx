import Url from "@core-ui/ApiServices/Types/Url";
import { ReactNode, useEffect, useRef, HTMLAttributes } from "react";
import useLocalize from "../../extensions/localization/useLocalize";
import Link from "../Atoms/Link";
import Tooltip from "../Atoms/Tooltip";

interface GoToArticleProps extends HTMLAttributes<HTMLAnchorElement> {
	trigger: ReactNode;
	href: string;
	distance?: number;
	onClick?: () => void;
}

const GoToArticle = (props: GoToArticleProps) => {
	const { trigger, href, distance = 10, onClick, ...otherProps } = props;
	const ref = useRef<HTMLAnchorElement>(null);

	useEffect(() => {
		ref.current?.blur();
	}, []);

	return (
		<Tooltip hideOnClick={true} content={useLocalize("goToArticle")} distance={distance}>
			<span onClick={onClick}>
				<Link href={Url.from({ pathname: href })} ref={ref} {...otherProps}>
					{trigger}
				</Link>
			</span>
		</Tooltip>
	);
};

export default GoToArticle;
