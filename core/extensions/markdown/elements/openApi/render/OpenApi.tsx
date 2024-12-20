import SpinnerLoader from "@components/Atoms/SpinnerLoader";
import styled from "@emotion/styled";
import { Suspense, lazy, useState } from "react";
import ApiUrlCreatorService from "../../../../../ui-logic/ContextServices/ApiUrlCreator";
import t from "@ext/localization/locale/translate";
import DiagramError from "@ext/markdown/elements/diagrams/component/DiagramError";
import OnLoadResourceService from "@ext/markdown/elements/copyArticles/onLoadResourceService";
const LazySwaggerUI = lazy(() => import("./SwaggerUI"));

interface OpenApiProps {
	src?: string;
	className?: string;
	flag?: boolean;
}

const OpenApi = (props: OpenApiProps) => {
	const { src, className, flag = true } = props;
	const [data, setData] = useState<string>();
	const [isError, setIsError] = useState(false);
	const apiUrlCreator = ApiUrlCreatorService.value;
	const onLoadResource = OnLoadResourceService.value;

	if (typeof window === "undefined" || !apiUrlCreator || !onLoadResource) return null;

	onLoadResource.useGetContent(src, apiUrlCreator, (buffer: Buffer) => {
		if (!buffer?.byteLength) setIsError(true);
		setData(buffer.toString());
	});

	return isError ? (
		<DiagramError
			error={{ message: t("diagram.error.cannot-get-data") }}
			title={t("diagram.error.specification")}
			diagramName="OpenApi"
		/>
	) : (
		<div data-focusable="true" className={className}>
			<Suspense
				fallback={
					<div className="suspense">
						<SpinnerLoader width={75} height={75} />
					</div>
				}
			>
				<LazySwaggerUI key={flag} defaultModelsExpandDepth={flag ? 1 : -1} spec={data} />
			</Suspense>
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
