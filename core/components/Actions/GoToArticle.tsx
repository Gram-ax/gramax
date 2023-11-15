import Url from "@core-ui/ApiServices/Types/Url";
import { ReactNode, useEffect, useRef } from "react";
import useLocalize from "../../extensions/localization/useLocalize";
import Link from "../Atoms/Link";
import Tooltip from "../Atoms/Tooltip";

const GoToArticle = ({
	trigger,
	href,
	distance = 10,
	onClick,
}: {
	trigger: ReactNode;
	href: string;
	distance?: number;
	onClick?: () => void;
}) => {
	const ref = useRef<HTMLAnchorElement>(null);

	useEffect(() => {
		ref.current?.blur();
	}, []);

	return (
		<Tooltip content={useLocalize("goToArticle")} distance={distance}>
			<span onClick={onClick}>
				<Link href={Url.from({ pathname: href })} ref={ref}>
					{trigger}
				</Link>
			</span>
		</Tooltip>
	);
};

export default GoToArticle;
