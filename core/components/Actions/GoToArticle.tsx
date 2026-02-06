import Url from "@core-ui/ApiServices/Types/Url";
import t from "@ext/localization/locale/translate";
import { HTMLAttributes, MouseEvent, ReactNode, useEffect, useRef } from "react";
import Link from "../Atoms/Link";
import Tooltip from "../Atoms/Tooltip";

interface GoToArticleProps extends HTMLAttributes<HTMLAnchorElement> {
	trigger: ReactNode;
	href: string;
	distance?: number;
	containerClassName?: string;
	onClick?: (e: MouseEvent) => void;
}

const GoToArticle = (props: GoToArticleProps) => {
	const { trigger, href, distance = 10, onClick, containerClassName, ...otherProps } = props;
	const ref = useRef<HTMLAnchorElement>(null);

	const onClickHandler = (e: MouseEvent) => {
		e.stopPropagation();

		onClick?.(e);
	};

	useEffect(() => {
		ref.current?.blur();
	}, []);

	return (
		<Tooltip content={t("go-to-article")} distance={distance} hideOnClick={true}>
			<span className={containerClassName} onClick={onClickHandler}>
				<Link href={Url.from({ pathname: href })} ref={ref} {...otherProps}>
					{trigger}
				</Link>
			</span>
		</Tooltip>
	);
};

export default GoToArticle;
