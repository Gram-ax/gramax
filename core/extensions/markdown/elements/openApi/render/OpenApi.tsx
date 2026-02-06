import SpinnerLoader from "@components/Atoms/SpinnerLoader";
import styled from "@emotion/styled";
import t from "@ext/localization/locale/translate";
import BlockCommentView from "@ext/markdown/elements/comment/edit/components/View/BlockCommentView";
import ResourceService from "@ext/markdown/elements/copyArticles/resourceService";
import DiagramError from "@ext/markdown/elements/diagrams/component/DiagramError";
import { lazy, Suspense, useState } from "react";
import ApiUrlCreatorService from "../../../../../ui-logic/ContextServices/ApiUrlCreator";

const LazySwaggerUI = lazy(() => import("./SwaggerUI"));

interface OpenApiProps {
	src?: string;
	className?: string;
	flag?: boolean;
	commentId?: string;
	isPrint?: boolean;
}

const OpenApi = (props: OpenApiProps) => {
	const { src, className, flag = true, commentId, isPrint } = props;
	const [data, setData] = useState<string>();
	const [isError, setIsError] = useState(false);
	const apiUrlCreator = ApiUrlCreatorService.value;
	const resourceService = ResourceService.value;

	if (typeof window === "undefined" || !apiUrlCreator || !resourceService) return null;

	resourceService.useGetResource(
		(buffer, resourceError) => {
			if (resourceError || !buffer || !buffer?.byteLength) return setIsError(true);
			setData(buffer.toString());
		},
		src,
		undefined,
		undefined,
		isPrint,
	);

	return (
		<div data-qa="qa-open-api">
			{isError ? (
				<DiagramError
					diagramName="OpenApi"
					error={{ message: t("diagram.error.cannot-get-data") }}
					title={t("diagram.error.specification")}
				/>
			) : (
				<div className={className} data-focusable="true">
					<Suspense
						fallback={
							<div className="suspense">
								<SpinnerLoader height={75} width={75} />
							</div>
						}
					>
						<BlockCommentView commentId={commentId}>
							<LazySwaggerUI defaultModelsExpandDepth={flag ? 1 : -1} key={flag} spec={data} />
						</BlockCommentView>
					</Suspense>
				</div>
			)}
		</div>
	);
};

export default styled(OpenApi)`
	.suspense {
		display: flex;
		align-items: center;
		justify-content: center;
	}
	.swagger-ui {
		background: var(--color-active-white-hover);
	}
`;
