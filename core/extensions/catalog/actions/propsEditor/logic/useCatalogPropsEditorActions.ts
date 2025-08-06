import FetchService from "@core-ui/ApiServices/FetchService";
import MimeTypes from "@core-ui/ApiServices/Types/MimeTypes";
import ApiUrlCreatorService from "@core-ui/ContextServices/ApiUrlCreator";
import ArticlePropsService from "@core-ui/ContextServices/ArticleProps";
import CatalogLogoService from "@core-ui/ContextServices/CatalogLogoService/Context";
import CatalogPropsService from "@core-ui/ContextServices/CatalogProps";
import { useRouter } from "@core/Api/useRouter";
import Path from "@core/FileProvider/Path/Path";
import RouterPathProvider from "@core/RouterPath/RouterPathProvider";
import { ClientCatalogProps } from "@core/SitePresenter/SitePresenter";
import getCatalogEditProps from "@ext/catalog/actions/propsEditor/logic/getCatalogEditProps";
import type CatalogEditProps from "@ext/catalog/actions/propsEditor/model/CatalogEditProps.schema";
import { useCallback, useMemo, useState } from "react";

interface UseCatalogPropsEditorActionsReturn {
	onMouseTriggerEnter: () => Promise<void>;
	allCatalogNames: string[];
	open: boolean;
	setOpen: (value: boolean) => void;
	originalProps: CatalogEditProps;
	onSubmit: (newProps: ClientCatalogProps) => Promise<void>;
	isLoading: boolean;
	error: string | null;
}

export const useCatalogPropsEditorActions = (): UseCatalogPropsEditorActionsReturn => {
	const apiUrlCreator = ApiUrlCreatorService.value;
	const catalogProps = CatalogPropsService.value;
	const articleProps = ArticlePropsService.value;
	const { confirmChanges: confirmCatalogLogoChanges } = CatalogLogoService.value();
	const router = useRouter();

	const [open, setOpenInner] = useState(false);
	const [allCatalogNames, setAllCatalogNames] = useState<string[]>([]);
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const originalProps = useMemo(() => getCatalogEditProps(catalogProps), [catalogProps]);

	const fetchCatalogNames = useCallback(async () => {
		try {
			const response = await FetchService.fetch(apiUrlCreator.getCatalogBrotherFileNames());
			if (!response.ok) {
				throw new Error(`Failed to fetch catalog names: ${response.statusText}`);
			}
			const names = await response.json();
			setAllCatalogNames(names);
			setError(null);
		} catch (err) {
			setError(err instanceof Error ? err.message : "Unknown error occurred");
		}
	}, [apiUrlCreator]);

	const onMouseTriggerEnter = useCallback(async () => {
		await fetchCatalogNames();
	}, [fetchCatalogNames]);

	const setOpen = useCallback((value: boolean) => {
		if (value) {
			setError(null);
		}
		setOpenInner(value);
	}, []);

	const buildNewPath = useCallback(
		(newCatalogProps: ClientCatalogProps) => {
			const basePathName = new Path(newCatalogProps.link.pathname);
			const { filePath } = RouterPathProvider.parseItemLogicPath(new Path(articleProps.logicPath));
			const isNewPath = RouterPathProvider.isEditorPathname(new Path(router.path).removeExtraSymbols);

			return isNewPath
				? RouterPathProvider.updatePathnameData(basePathName, { filePath }).value
				: Path.join(basePathName.value, ...filePath);
		},
		[articleProps.logicPath, router.path],
	);

	const onSubmit = useCallback(
		async (newProps: ClientCatalogProps) => {
			const mergedProps = { ...originalProps, ...newProps };

			setIsLoading(true);
			setError(null);

			try {
				const response = await FetchService.fetch<ClientCatalogProps>(
					apiUrlCreator.updateCatalogProps(),
					JSON.stringify(mergedProps),
					MimeTypes.json,
				);

				if (!response.ok) {
					throw new Error(`Failed to update catalog props: ${response.statusText}`);
				}

				const newCatalogProps = await response.json();
				CatalogPropsService.value = newCatalogProps;

				const newPath = buildNewPath(newCatalogProps);
				router.pushPath(newPath);

				await confirmCatalogLogoChanges();
				setOpenInner(false);
			} catch (err) {
				setError(err instanceof Error ? err.message : "Unknown error occurred");
			} finally {
				setIsLoading(false);
			}
		},
		[originalProps, apiUrlCreator, buildNewPath, router, confirmCatalogLogoChanges],
	);

	return {
		onMouseTriggerEnter,
		allCatalogNames,
		open,
		setOpen,
		originalProps,
		onSubmit,
		isLoading,
		error,
	};
};
