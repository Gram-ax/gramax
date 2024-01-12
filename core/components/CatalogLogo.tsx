import resolveModule from "@app/resolveModule";
import FetchService from "@core-ui/ApiServices/FetchService";
import ApiUrlCreatorService from "@core-ui/ContextServices/ApiUrlCreator";
import { useEffect, useRef, useState } from "react";

export const CatalogLogo = ({
	catalogName,
	...props
}: {
	catalogName?: string;
	style?: { [param: string]: string };
}) => {
	const useImage = resolveModule("useImage");
	const [isError, serIsError] = useState(false);
	const ref = useRef<HTMLImageElement>(null);
	const apiUrlCreator = ApiUrlCreatorService.value;
	useEffect(() => {
		FetchService.fetch(apiUrlCreator.getLogoUrl(catalogName)).then((r) => serIsError(!r.ok));
	}, []);
	const imageSrc = useImage(apiUrlCreator.getLogoUrl(catalogName));

	return (
		!isError &&
		imageSrc && (
			<img
				ref={ref}
				src={imageSrc}
				data-qa="catalog-logo"
				{...props}
				onError={() => {
					if (ref.current) ref.current.style.display = "none";
				}}
				alt=""
			/>
		)
	);
};
