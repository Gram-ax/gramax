import { useRouter } from "@core/Api/useRouter";
import Path from "@core/FileProvider/Path/Path";
import { useEditLfsOptions } from "@core/GitLfs/hooks/useEditLfsOptions";
import RouterPathProvider from "@core/RouterPath/RouterPathProvider";
import type { ClientCatalogProps } from "@core/SitePresenter/SitePresenter";
import FetchService from "@core-ui/ApiServices/FetchService";
import MimeTypes from "@core-ui/ApiServices/Types/MimeTypes";
import ApiUrlCreatorService from "@core-ui/ContextServices/ApiUrlCreator";
import CatalogLogoService from "@core-ui/ContextServices/CatalogLogoService/Context";
import { useArticlePropsStore } from "@core-ui/stores/ArticlePropsStore/ArticlePropsStore.provider";
import { useCatalogPropsStore } from "@core-ui/stores/CatalogPropsStore/CatalogPropsStore.provider";
import type { LogoState } from "@ext/catalog/actions/propsEditor/components/UploadCatalogLogo";
import getCatalogEditProps from "@ext/catalog/actions/propsEditor/logic/getCatalogEditProps";
import type CatalogEditProps from "@ext/catalog/actions/propsEditor/model/CatalogEditProps";
import {
	getLogoEmoji,
	isLogoEmoji,
	isLogoIcon,
	makeLogoEmoji,
	makeLogoIcon,
	parseLogoIcon,
} from "@ext/catalog/logo/catalogLogoIcon";
import type { IconPickerColor } from "@ext/markdown/elements/icon/edit/components/IconPicker/IconPicker";
import type { IconEditorProps } from "@ext/markdown/elements/icon/edit/model/types";
import Theme from "@ext/Theme/Theme";
import { useCallback, useEffect, useState } from "react";

const logoToFormState = (logo: string, fallback: string): LogoState => {
	if (!logo) return null;
	if (isLogoIcon(logo)) {
		const { code, color } = parseLogoIcon(logo);
		return { type: "icon", code, color: color as IconPickerColor };
	}
	if (isLogoEmoji(logo)) return { type: "emoji", emoji: getLogoEmoji(logo) };
	return fallback ? { type: "file", preview: fallback, content: undefined, file: null } : null;
};

type ExtendedCatalogEditProps = Omit<CatalogEditProps, "logo" | "logo_dark"> & {
	icons: { name: string; content: string; size: number; type: string }[];
	logo?: {
		light?: LogoState;
		dark?: LogoState;
	};
	lfs?: { patterns: string[] };
};

const hasLogoField = (
	logoData: ExtendedCatalogEditProps["logo"],
	theme: "light" | "dark",
): logoData is NonNullable<ExtendedCatalogEditProps["logo"]> =>
	Boolean(logoData && Object.hasOwn(logoData, theme) && logoData[theme] !== undefined);

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
	const logicPath = useArticlePropsStore((s) => s.data.logicPath);
	const { darkLogo, lightLogo, refreshState, refreshLogo } = CatalogLogoService.value();
	const router = useRouter();

	const [open, setOpenInner] = useState(true);
	const [allCatalogNames, setAllCatalogNames] = useState<string[]>([]);
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const { getLfsOptions, updateLfsOptions, allowed: allowedEditLfsOptions } = useEditLfsOptions();

	const getOriginalProps = useCallback(async (): Promise<ExtendedCatalogEditProps> => {
		const res = await FetchService.fetch(apiUrlCreator.getCustomIconsList());
		const { logo, logo_dark, ...baseProps } = getCatalogEditProps(catalogProps.data);
		if (!res.ok) return { ...baseProps, icons: [] };
		const icons = (await res.json()) ?? [];

		const lfsOptions = allowedEditLfsOptions ? await getLfsOptions() : null;
		const lfs = lfsOptions ? { patterns: lfsOptions.patterns } : { patterns: [] };

		return {
			...baseProps,
			logo: {
				light: logoToFormState(logo, lightLogo),
				dark: logoToFormState(logo_dark, darkLogo),
			},
			icons: icons.map((icon: IconEditorProps) => ({
				name: icon.code,
				content: icon.svg,
				size: icon.size,
				type: "image/svg+xml",
			})),
			filterProperty: baseProps.filterProperty
				? baseProps.properties?.find((p) => p.name === baseProps.filterProperty)?.name
				: null,
			lfs,
		};
	}, [catalogProps.data, allowedEditLfsOptions, getLfsOptions, lightLogo, darkLogo]);

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
	}, []);

	useEffect(() => {
		void fetchCatalogNames();
	}, [fetchCatalogNames]);

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
			const { filePath } = RouterPathProvider.parseItemLogicPath(new Path(logicPath));
			const isNewPath = RouterPathProvider.isEditorPathname(new Path(router.path).removeExtraSymbols);

			return isNewPath
				? RouterPathProvider.updatePathnameData(basePathName, { filePath }).value
				: Path.join(basePathName.value, ...filePath);
		},
		[router.path, logicPath],
	);

	const deleteIcons = useCallback(
		async (icons: { name: string; content: string }[], initialIcons: { name: string; content: string }[]) => {
			await initialIcons.forEachAsync(async (icon) => {
				if (icons.some((i) => i.content === icon.content)) return;
				await FetchService.fetch(apiUrlCreator.deleteCustomIcon(icon.name));
			});
		},
		[],
	);

	const uploadIcons = useCallback(async (icons: { name: string; content: string }[]) => {
		await icons.forEachAsync(async (icon) => {
			await FetchService.fetch(
				apiUrlCreator.createCustomIcon(),
				JSON.stringify({
					code: new Path(icon.name).name,
					svg: icon.content,
				}),
			);
		});
	}, []);

	const updateLogoFiles = useCallback(
		async (
			logoData: ExtendedCatalogEditProps["logo"],
			originalLogoName: string,
			originalLogoDarkName: string,
			catalogName: string,
		): Promise<{ logo?: string; logo_dark?: string }> => {
			const result: { logo?: string; logo_dark?: string } = {};

			const isUnchangedFileLogo = (state: LogoState): boolean =>
				state?.type === "file" && !state.content && !state.file;

			const getLogo = async (state: LogoState): Promise<string> => {
				if (state.type === "icon") return makeLogoIcon(state.code, state.color);
				if (state.type === "emoji") return makeLogoEmoji(state.emoji);

				const ext = state.file?.name.split(".").pop() ?? "svg";
				const fileName = `logo.${ext}`;
				if (state.content) {
					await FetchService.fetch(apiUrlCreator.updateCatalogLogo(catalogName, fileName), state.content);
				}
				return fileName;
			};

			if (hasLogoField(logoData, "light") && !isUnchangedFileLogo(logoData.light)) {
				if (originalLogoName) {
					await FetchService.fetch(apiUrlCreator.deleteCatalogLogo(catalogName, Theme.light));
				}
				if (logoData.light) {
					result.logo = await getLogo(logoData.light);
				} else {
					result.logo = "";
				}
			}

			if (hasLogoField(logoData, "dark") && !isUnchangedFileLogo(logoData.dark)) {
				if (originalLogoDarkName) {
					await FetchService.fetch(apiUrlCreator.deleteCatalogLogo(catalogName, Theme.dark));
				}

				if (logoData.dark) {
					result.logo_dark = await getLogo(logoData.dark);
				} else {
					result.logo_dark = "";
				}
			}

			return result;
		},
		[],
	);

	const onSubmit = useCallback(
		async (newProps: ExtendedCatalogEditProps, defaultValues: ExtendedCatalogEditProps) => {
			const originalProps: ExtendedCatalogEditProps = await getOriginalProps();

			const mergedProps = {
				...originalProps,
				...newProps,
			};

			const { logo: logoFormData, icons, lfs, ...restMergedProps } = mergedProps;

			setIsLoading(true);
			setError(null);

			try {
				await deleteIcons(icons, defaultValues.icons);
				await uploadIcons(icons);

				if (allowedEditLfsOptions && lfs) {
					await updateLfsOptions({ patterns: lfs.patterns });
				}

				const logoProps = await updateLogoFiles(
					logoFormData,
					catalogProps.data.logo,
					catalogProps.data.logo_dark,
					catalogProps.data.name,
				);

				const propsToSend = { ...restMergedProps, ...logoProps };

				const response = await FetchService.fetch<ClientCatalogProps>(
					apiUrlCreator.updateCatalogProps(),
					JSON.stringify(propsToSend),
					MimeTypes.json,
				);

				if (!response.ok) {
					throw new Error(`Failed to update catalog props: ${response.statusText}`);
				}

				const newCatalogProps = await response.json();
				catalogProps.update(newCatalogProps);

				const newPath = buildNewPath(newCatalogProps);
				router.pushPath(newPath);

				if (Object.keys(logoProps).length > 0) {
					await refreshState();
					await refreshLogo();
				}

				setOpen(false);
			} catch (err) {
				setError(err instanceof Error ? err.message : "Unknown error occurred");
			} finally {
				setIsLoading(false);
			}
		},
		[
			getOriginalProps,
			buildNewPath,
			router,
			setOpen,
			deleteIcons,
			uploadIcons,
			allowedEditLfsOptions,
			updateLfsOptions,
			updateLogoFiles,
			catalogProps,
			refreshState,
			refreshLogo,
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
