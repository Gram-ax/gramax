import ArticlePropsService from "@core-ui/ContextServices/ArticleProps";
import styled from "@emotion/styled";
import Image from "@ext/markdown/elements/image/edit/components/Image";
import { ReactElement, useState } from "react";
import getDrawioID from "../../edit/logic/getDrawioID";
import OnLoadResourceService from "@ext/markdown/elements/copyArticles/onLoadResourceService";
import ApiUrlCreatorService from "@core-ui/ContextServices/ApiUrlCreator";
import DiagramError from "@ext/markdown/elements/diagrams/component/DiagramError";
import t from "@ext/localization/locale/translate";

interface DrawioProps {
	src: string;
	title: string;
	className?: string;
}

const Drawio = (props: DrawioProps): ReactElement => {
	const { src, title, className } = props;
	const articleProps = ArticlePropsService.value;
	const apiUrlCreator = ApiUrlCreatorService.value;

	const [isError, setIsError] = useState(false);

	if (!src) return null;

	OnLoadResourceService.useGetContent(src, apiUrlCreator, (buffer) => {
		if (!buffer.byteLength) setIsError(true);
	});

	return isError ? (
		<DiagramError error={{ message: t("diagram.error.cannot-get-data") }} diagramName="Drawio" />
	) : (
		<Image src={src} id={getDrawioID(src, articleProps.logicPath)} className={className} title={title} />
	);
};

export default styled(Drawio)`
	max-width: 90% !important;
	max-height: none !important;
	border-radius: var(--radius-normal);
	background: var(--color-diagram-bg);
`;
