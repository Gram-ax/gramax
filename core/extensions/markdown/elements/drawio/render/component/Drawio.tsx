import Image from "@components/Atoms/Image/Image";
import ArticlePropsService from "@core-ui/ContextServices/ArticleProps";
import styled from "@emotion/styled";
import { ReactElement } from "react";
import getDrawioID from "../../edit/logic/getDrawioID";

const Drawio = styled(({ src, title, className }: { src: string; title: string; className?: string }): ReactElement => {
	const articleProps = ArticlePropsService.value;

	return <Image src={src} id={getDrawioID(src, articleProps.logicPath)} className={className} title={title} />;
})`
	padding: 20px;
	max-width: 90% !important;
	max-height: none !important;
	border-radius: var(--radius-block);
	background: var(--color-diagram-bg);
`;

export default Drawio;
