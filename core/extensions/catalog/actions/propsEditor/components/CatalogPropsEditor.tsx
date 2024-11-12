import { NEW_CATALOG_NAME } from "@app/config/const";
import Button from "@components/Atoms/Button/Button";
import { ButtonStyle } from "@components/Atoms/Button/ButtonStyle";
import SpinnerLoader from "@components/Atoms/SpinnerLoader";
import Form from "@components/Form/Form";
import LogsLayout from "@components/Layouts/LogsLayout";
import ModalLayout from "@components/Layouts/Modal";
import ModalLayoutLight from "@components/Layouts/ModalLayoutLight";
import MimeTypes from "@core-ui/ApiServices/Types/MimeTypes";
import ArticlePropsService from "@core-ui/ContextServices/ArticleProps";
import CatalogPropsService from "@core-ui/ContextServices/CatalogProps";
import useWatch from "@core-ui/hooks/useWatch";
import { transliterate } from "@core-ui/languageConverter/transliterate";
import openNewTab from "@core-ui/utils/openNewTab";
import { useRouter } from "@core/Api/useRouter";
import Path from "@core/FileProvider/Path/Path";
import RouterPathProvider from "@core/RouterPath/RouterPathProvider";
import type { ClientCatalogProps } from "@core/SitePresenter/SitePresenter";
import { uniqueName } from "@core/utils/uniqueName";
import validateEncodingSymbolsUrl from "@core/utils/validateEncodingSymbolsUrl";
import getCatalogEditProps from "@ext/catalog/actions/propsEditor/logic/getCatalogEditProps";
import getRepUrl from "@ext/git/core/GitPathnameHandler/clone/logic/getRepUrl";
import GitShareData from "@ext/git/core/model/GitShareData";
import t from "@ext/localization/locale/translate";
import getPartGitSourceDataByStorageName from "@ext/storage/logic/utils/getPartSourceDataByStorageName";
import { JSONSchema7 } from "json-schema";
import { useState } from "react";
import FetchService from "../../../../../ui-logic/ApiServices/FetchService";
import ApiUrlCreatorService from "../../../../../ui-logic/ContextServices/ApiUrlCreator";
import CatalogEditProps from "../model/CatalogEditProps.schema";
import Schema from "../model/CatalogEditProps.schema.json";

const CatalogPropsEditor = ({
	trigger,
	onSubmit: onSubmitParent,
	...props
}: {
	isOpen?: boolean;
	onSubmit?: (editProps: any) => void;
	onClose?: () => void;
	trigger?: JSX.Element;
}) => {
	const maxLength = t("max-length");
	const suchCatalogExists = t("catalog.error.already-exist");
	const noEncodingSymbolsInUrl = t("no-encoding-symbols-in-url");

	const apiUrlCreator = ApiUrlCreatorService.value;
	const [isOpen, setIsOpen] = useState(props.isOpen);
	const [allCatalogNames, setAllCatalogNames] = useState<string[]>([]);

	useWatch(() => setIsOpen(props.isOpen), [props.isOpen]);

	const router = useRouter();
	const articleProps = ArticlePropsService.value;
	const catalogProps = CatalogPropsService.value;
	const [generatedUrl, setGeneratedUrl] = useState<string>(catalogProps.name);
	const [editProps, setEditProps] = useState(getCatalogEditProps(catalogProps));
	const [saveProcess, setSaveProcess] = useState(false);

	useWatch(() => setEditProps(getCatalogEditProps(catalogProps)), [catalogProps]);
	const { sourceType } = getPartGitSourceDataByStorageName(catalogProps.sourceName);

	const onSubmit = async (props: CatalogEditProps) => {
		setSaveProcess(true);
		const result = await FetchService.fetch<ClientCatalogProps>(
			apiUrlCreator.updateCatalogProps(),
			JSON.stringify(props),
			MimeTypes.json,
		);
		if (!result.ok) return;
		const newCatalogProps = await result.json();
		setSaveProcess(false);
		CatalogPropsService.value = newCatalogProps;

		const basePathName = new Path(newCatalogProps.link.pathname);
		const { filePath } = RouterPathProvider.parseItemLogicPath(new Path(articleProps.logicPath));
		const isNewPath = RouterPathProvider.isEditorPathname(new Path(router.path).removeExtraSymbols);

		router.pushPath(
			isNewPath
				? RouterPathProvider.updatePathnameData(basePathName, { filePath }).value
				: Path.join(basePathName.value, ...filePath),
		);

		onSubmitParent?.(props);
		setEditProps(getCatalogEditProps(newCatalogProps));
	};

	const onChange = (props: CatalogEditProps) => {
		if (sourceType) return;
		if (
			!props.title ||
			(props.title == catalogProps.title && props.url.includes(NEW_CATALOG_NAME)) ||
			!catalogProps.name.includes(NEW_CATALOG_NAME) ||
			props.url != generatedUrl
		)
			return;
		const generated = uniqueName(transliterate(props.title, { kebab: true, maxLength: 50 }), allCatalogNames);
		setGeneratedUrl(generated);
		props.url = generated;
		setEditProps({ ...props });
	};

	const submit = (props: CatalogEditProps) => {
		if (onSubmit) onSubmit(props);
		setIsOpen(false);
	};

	const loadAllCatalogNames = async () => {
		const res = await FetchService.fetch(apiUrlCreator.getCatalogBrotherFileNames());
		if (!res.ok) return;
		setAllCatalogNames(await res.json());
	};

	const validateUrl = (
		allCatalogNames: string[],
		url: string,
		suchCatalogExists: string,
		noEncodingSymbolsInUrl: string,
	): string => {
		if (allCatalogNames.includes(url)) return suchCatalogExists;
		if (!validateEncodingSymbolsUrl(url)) return noEncodingSymbolsInUrl;
		return null;
	};

	return (
		<>
			<ModalLayout isOpen={saveProcess}>
				<LogsLayout style={{ overflow: "hidden" }}>
					<SpinnerLoader fullScreen />
				</LogsLayout>
			</ModalLayout>
			<ModalLayout
				trigger={trigger}
				isOpen={isOpen}
				closeOnCmdEnter={false}
				onOpen={() => {
					loadAllCatalogNames();
					setIsOpen(true);
				}}
				onClose={() => {
					setIsOpen(false);
					setEditProps(getCatalogEditProps(catalogProps));
					setGeneratedUrl(undefined);
					props.onClose?.();
				}}
			>
				<ModalLayoutLight>
					<Form<CatalogEditProps>
						fieldDirection="row"
						leftButton={
							<>
								{!!sourceType && (
									<Button
										style={{ margin: 0 }}
										buttonStyle={ButtonStyle.underline}
										onClick={() => {
											const pathnameData = RouterPathProvider.parsePath(
												new Path(catalogProps.link.pathname),
											);
											const gitShareData: GitShareData = {
												sourceType: getPartGitSourceDataByStorageName(pathnameData.sourceName)
													.sourceType,
												domain: pathnameData.sourceName,
												group: pathnameData.group,
												branch: pathnameData.refname,
												name: pathnameData.repo,
												filePath: "",
											};
											openNewTab(getRepUrl(gitShareData).href);
										}}
									>
										{t("open-in.generic") + " " + sourceType}
									</Button>
								)}
							</>
						}
						schema={Schema as JSONSchema7}
						props={editProps}
						validateDeps={[allCatalogNames]}
						validate={({ url, description, code }) => {
							return {
								url: validateUrl(allCatalogNames, url, suchCatalogExists, noEncodingSymbolsInUrl),
								description: description?.length > 50 ? maxLength + 50 : null,
								code: code?.length > 4 ? maxLength + 4 : null,
							};
						}}
						onChange={onChange}
						onSubmit={submit}
						onMount={(_, schema) => {
							schema.properties = {
								title: Schema.properties.title,
								url: Schema.properties.url,
								docroot: Schema.properties.docroot,
								language: Schema.properties.language,
								versions: Schema.properties.versions,
								_h2: t("display-on-homepage"),
								description: Schema.properties.description,
								style: Schema.properties.style,
								code: Schema.properties.code,
							} as any;
							(schema.properties.versions as any).readOnly = !!sourceType;
							(schema.properties.language as any).readOnly = !!catalogProps.language;
							(schema.properties.url as any).readOnly = !!sourceType;
						}}
					/>
				</ModalLayoutLight>
			</ModalLayout>
		</>
	);
};

export default CatalogPropsEditor;
