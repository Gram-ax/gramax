import ArticlePropsService from "@core-ui/ContextServices/ArticleProps";
import styled from "@emotion/styled";
import Image from "@ext/markdown/elements/image/edit/components/Image";
import { ReactElement } from "react";
import getDrawioID from "../../edit/logic/getDrawioID";

interface DrawioProps {
	src: string;
	title: string;
	className?: string;
}

const Drawio = (props: DrawioProps): ReactElement => {
	const { src, title, className } = props;
	const articleProps = ArticlePropsService.value;

	if (!src) return null;
	return <Image src={src} id={getDrawioID(src, articleProps.logicPath)} className={className} title={title} />;
};

export default styled(Drawio)`
	max-width: 90% !important;
	max-height: none !important;
	border-radius: var(--radius-normal);
	background: var(--color-diagram-bg);
`;
