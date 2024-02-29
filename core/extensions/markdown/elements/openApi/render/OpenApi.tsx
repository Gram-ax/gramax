import SpinnerLoader from "@components/Atoms/SpinnerLoader";
import styled from "@emotion/styled";
import { Suspense, lazy, useEffect, useState, useCallback } from "react";
import FetchService from "../../../../../ui-logic/ApiServices/FetchService";
import MimeType from "../../../../../ui-logic/ApiServices/Types/MimeTypes";
import ApiUrlCreatorService from "../../../../../ui-logic/ContextServices/ApiUrlCreator";
const LazySwaggerUI = lazy(() => import("swagger-ui-react"));

const OpenApi = (props: { src?: string; className?: string; flag?: boolean; isUpdating?: boolean }) => {
	const { src, className, flag = true, isUpdating = false } = props;
	const [data, setData] = useState<string>();
	const apiUrlCreator = ApiUrlCreatorService.value;

	const loadData = useCallback(
		async (src: string) => {
			const res = await FetchService.fetch(apiUrlCreator.getArticleResource(src, MimeType.text));
			if (!res.ok) return;
			setData(await res.text());
		},
		[apiUrlCreator],
	);

	useEffect(() => {
		void loadData(src);
	}, [src, isUpdating]);

	if (typeof window === "undefined" || !apiUrlCreator) return null;

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
