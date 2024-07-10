import resolveModule from "@app/resolveModule/frontend";
import ApiUrlCreatorService from "@core-ui/ContextServices/ApiUrlCreator";
import ThemeService from "@ext/Theme/components/ThemeService";
import { useRef, useState } from "react";

export const CatalogLogo = ({
	catalogName,
	...props
}: {
	catalogName?: string;
	style?: { [param: string]: string };
}) => {
	const useImage = resolveModule("useImage");
	const [isError, setIsError] = useState(false);
	const ref = useRef<HTMLImageElement>(null);
	const apiUrlCreator = ApiUrlCreatorService.value;
	const theme = ThemeService.value;
	const imageSrc = useImage(apiUrlCreator.getLogoUrl(catalogName, theme));

	return (
		!isError &&
		imageSrc && <img ref={ref} src={imageSrc} {...props} onError={() => setIsError(true)} alt={catalogName} />
	);
};
