import SpinnerLoader from "@components/Atoms/SpinnerLoader";
import styled from "@emotion/styled";
import { Suspense, lazy, useEffect, useState } from "react";
import FetchService from "../../../../../../ui-logic/ApiServices/FetchService";
import MimeType from "../../../../../../ui-logic/ApiServices/Types/MimeTypes";
import ApiUrlCreatorService from "../../../../../../ui-logic/ContextServices/ApiUrlCreator";
const LazySwaggerUI = lazy(() => import("swagger-ui-react"));

const OpenApi = styled(({ src, className, flag = true }: { src: string; className?: string; flag?: boolean }) => {
	const [data, setData] = useState<string>();
	const apiUrlCreator = ApiUrlCreatorService.value;

	if (typeof window === "undefined" || !apiUrlCreator) return null;

	const loadData = async () => {
		const res = await FetchService.fetch(apiUrlCreator.getArticleResource(src, MimeType.text));
		if (!res.ok) return;
		setData(await res.text());
	};

	useEffect(() => {
		loadData();
	}, []);

	return (
		<Suspense
			fallback={
				<div className={className}>
					<SpinnerLoader width={75} height={75} />
				</div>
			}
		>
			<LazySwaggerUI defaultModelsExpandDepth={flag ? 1 : -1} spec={data} />
		</Suspense>
	);
})`
	display: flex;
	align-items: center;
	justify-content: center;
`;

export default OpenApi;
