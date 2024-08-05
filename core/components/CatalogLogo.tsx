import resolveModule from "@app/resolveModule/frontend";
import ApiUrlCreatorService from "@core-ui/ContextServices/ApiUrlCreator";
import ThemeService from "@ext/Theme/components/ThemeService";
import { useState } from "react";

export const CatalogLogo = ({ catalogName }: { catalogName?: string }) => {
	const useImage = resolveModule("useImage");
	const [isError, setIsError] = useState(false);
	const theme = ThemeService.value;
	const apiUrlCreator = ApiUrlCreatorService.value;
	const imageSrc = useImage(apiUrlCreator.getLogoUrl(catalogName, theme));

	return !isError && imageSrc && <img src={imageSrc} onError={() => setIsError(true)} alt={catalogName} />;
};
