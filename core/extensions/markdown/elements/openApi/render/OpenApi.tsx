import SpinnerLoader from "@components/Atoms/SpinnerLoader";
import styled from "@emotion/styled";
import OnLoadResourceService from "@ext/markdown/elements/copyArticles/onLoadResourceService";
import { Suspense, lazy, useState } from "react";
import ApiUrlCreatorService from "../../../../../ui-logic/ContextServices/ApiUrlCreator";
const LazySwaggerUI = lazy(() => import("./SwaggerUI"));

interface OpenApiProps {
	src?: string;
	className?: string;
	flag?: boolean;
}

const OpenApi = (props: OpenApiProps) => {
	const { src, className, flag = true } = props;
	const [data, setData] = useState<string>();
	const apiUrlCreator = ApiUrlCreatorService.value;

	if (typeof window === "undefined" || !apiUrlCreator || !OnLoadResourceService.value) return null;

	OnLoadResourceService.useGetContent(src, apiUrlCreator, (buffer: Buffer) => {
		setData(buffer.toString());
	});

	return (
		<div data-focusable="true">
			<Suspense
				fallback={
					<div className={className}>
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
	display: flex;
	align-items: center;
	justify-content: center;
`;
