import FetchService from "@core-ui/ApiServices/FetchService";
import MimeTypes from "@core-ui/ApiServices/Types/MimeTypes";
import ApiUrlCreatorService from "@core-ui/ContextServices/ApiUrlCreator";
import ArticlePropsService from "@core-ui/ContextServices/ArticleProps";
import CatalogLogoService from "@core-ui/ContextServices/CatalogLogoService/Context";
import { useCatalogPropsStore } from "@core-ui/stores/CatalogPropsStore/CatalogPropsStore.provider";
import { useRouter } from "@core/Api/useRouter";
import Path from "@core/FileProvider/Path/Path";
import RouterPathProvider from "@core/RouterPath/RouterPathProvider";
import { ClientCatalogProps } from "@core/SitePresenter/SitePresenter";
import getCatalogEditProps from "@ext/catalog/actions/propsEditor/logic/getCatalogEditProps";
import { useEditTrackedLfsPatterns } from "@ext/catalog/actions/propsEditor/logic/useEditTrackedLfsPatterns";
import type CatalogEditProps from "@ext/catalog/actions/propsEditor/model/CatalogEditProps";
import { IconEditorProps } from "@ext/markdown/elements/icon/edit/model/types";
import { useCallback, useEffect, useState } from "react";

type ExtendedCatalogEditProps = CatalogEditProps & {
	icons: { name: string; content: string; size: number; type: string }[];
	logo?: {
		light?: null;
		dark?: null;
	};
	lfs?: string[];
};

interface UseCatalogPropsEditorActionsReturn {
	allCatalogNames: string[];
	open: boolean;
	setOpen: (value: boolean) => void;
	getOriginalProps: () => Promise<ExtendedCatalogEditProps>;
	onSubmit: (newProps: ExtendedCatalogEditProps, defaultValues: ExtendedCatalogEditProps) => Promise<void>;
	isLoading: boolean;
	error: string | null;
}

export const useCatalogPropsEditorActions = (onClose: () => void): UseCatalogPropsEditorActionsReturn => {
	const apiUrlCreator = ApiUrlCreatorService.value;
	const catalogProps = useCatalogPropsStore((state) => state, "shallow");
	const articleProps = ArticlePropsService.value;
	const { confirmChanges: confirmCatalogLogoChanges } = CatalogLogoService.value();
	const router = useRouter();

	const [open, setOpenInner] = useState(true);
	const [allCatalogNames, setAllCatalogNames] = useState<string[]>([]);
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const {
		getTrackedLfsPatterns,
		updateTrackedLfsPatterns,
		allowed: allowedEditTrackedLfsPatterns,
	} = useEditTrackedLfsPatterns();

	const getOriginalProps = useCallback(async (): Promise<ExtendedCatalogEditProps> => {
		const res = await FetchService.fetch(apiUrlCreator.getCustomIconsList());
		if (!res.ok) return { ...getCatalogEditProps(catalogProps.data), icons: [] };
		const icons = (await res.json()) ?? [];

		const lfs = allowedEditTrackedLfsPatterns ? await getTrackedLfsPatterns() : [];

		return {
			...getCatalogEditProps(catalogProps.data),
			icons: icons.map((icon: IconEditorProps) => ({
				name: icon.code,
				content: icon.svg,
				size: icon.size,
				type: "image/svg+xml",
			})),
			lfs,
		};
	}, [catalogProps.data, apiUrlCreator]);

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

	useEffect(() => {
		void fetchCatalogNames();
	}, []);

	const setOpen = useCallback(
		(value: boolean) => {
			if (value) setError(null);
			setOpenInner(value);
			if (!value) onClose?.();
		},
		[onClose],
	);

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

	const deleteIcons = useCallback(
		async (icons: { name: string; content: string }[], initialIcons: { name: string; content: string }[]) => {
			await initialIcons.forEachAsync(async (icon) => {
				if (icons.some((i) => i.content === icon.content)) return;
				await FetchService.fetch(apiUrlCreator.deleteCustomIcon(icon.name));
			});
		},
		[apiUrlCreator],
	);

	const uploadIcons = useCallback(
		async (icons: { name: string; content: string }[]) => {
			await icons.forEachAsync(async (icon) => {
				await FetchService.fetch(
					apiUrlCreator.createCustomIcon(),
					JSON.stringify({
						code: new Path(icon.name).name,
						svg: icon.content,
					}),
				);
			});
		},
		[apiUrlCreator],
	);

	const onSubmit = useCallback(
		async (newProps: ExtendedCatalogEditProps, defaultValues: ExtendedCatalogEditProps) => {
			const originalProps: ExtendedCatalogEditProps = await getOriginalProps();

			const mergedProps = {
				...originalProps,
				...newProps,
			};

			console.log({
				originalProps: { ...originalProps },
				newProps: { ...newProps },
				mergedProps: {
					...mergedProps,
				},
			});

			delete mergedProps.logo;

			setIsLoading(true);
			setError(null);

			try {
				await deleteIcons(mergedProps.icons, defaultValues.icons);
				await uploadIcons(mergedProps.icons);
				delete mergedProps.icons;

				console.log("allowedEditTrackedLfsPatterns", mergedProps.lfs);
				if (allowedEditTrackedLfsPatterns) await updateTrackedLfsPatterns(mergedProps.lfs);
				delete mergedProps.lfs;

				const response = await FetchService.fetch<ClientCatalogProps>(
					apiUrlCreator.updateCatalogProps(),
					JSON.stringify(mergedProps),
					MimeTypes.json,
				);

				if (!response.ok) {
					throw new Error(`Failed to update catalog props: ${response.statusText}`);
				}

				const newCatalogProps = await response.json();
				catalogProps.update(newCatalogProps);

				const newPath = buildNewPath(newCatalogProps);
				router.pushPath(newPath);

				await confirmCatalogLogoChanges();
				setOpen(false);
			} catch (err) {
				setError(err instanceof Error ? err.message : "Unknown error occurred");
			} finally {
				setIsLoading(false);
			}
		},
		[
			getOriginalProps,
			apiUrlCreator,
			buildNewPath,
			router,
			confirmCatalogLogoChanges,
			setOpen,
			deleteIcons,
			uploadIcons,
		],
	);

	return {
		allCatalogNames,
		open,
		setOpen,
		getOriginalProps,
		onSubmit,
		isLoading,
		error,
	};
};
