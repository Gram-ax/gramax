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
import { useCallback, useState } from "react";

export const useCatalogPropsEditorActions = () => {
	const apiUrlCreator = ApiUrlCreatorService.value;
	const [open, setOpenInner] = useState(false);
	const [allCatalogNames, setAllCatalogNames] = useState<string[]>([]);
	const catalogProps = CatalogPropsService.value;
	const [originalProps, setOriginalProps] = useState<CatalogEditProps>(getCatalogEditProps(catalogProps));
	const articleProps = ArticlePropsService.value;
	const router = useRouter();
	const { confirmChanges: confirmCatalogLogoChanges } = CatalogLogoService.value();

	const onMouseTriggerEnter = async () => {
		const res = await FetchService.fetch(apiUrlCreator.getCatalogBrotherFileNames());
		if (!res.ok) return;
		setAllCatalogNames(await res.json());
	};

	const setOpen = useCallback(
		(v: boolean) => {
			if (v) setOriginalProps(getCatalogEditProps(catalogProps));
			setOpenInner(v);
		},
		[catalogProps],
	);

	const onSubmit = async (newProps: ClientCatalogProps) => {
		const props = { ...originalProps, ...newProps };

		const result = await FetchService.fetch<ClientCatalogProps>(
			apiUrlCreator.updateCatalogProps(),
			JSON.stringify(props),
			MimeTypes.json,
		);
		if (!result.ok) return;

		const newCatalogProps = await result.json();
		CatalogPropsService.value = newCatalogProps;

		const basePathName = new Path(newCatalogProps.link.pathname);
		const { filePath } = RouterPathProvider.parseItemLogicPath(new Path(articleProps.logicPath));
		const isNewPath = RouterPathProvider.isEditorPathname(new Path(router.path).removeExtraSymbols);

		router.pushPath(
			isNewPath
				? RouterPathProvider.updatePathnameData(basePathName, { filePath }).value
				: Path.join(basePathName.value, ...filePath),
		);

		await confirmCatalogLogoChanges();

		setOpenInner(false);
	};

	return { onMouseTriggerEnter, allCatalogNames, open, setOpen, originalProps, onSubmit };
};
