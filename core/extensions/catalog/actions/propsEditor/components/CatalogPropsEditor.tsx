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
import { useRouter } from "@core/Api/useRouter";
import Path from "@core/FileProvider/Path/Path";
import RouterPathProvider from "@core/RouterPath/RouterPathProvider";
import type { ClientCatalogProps } from "@core/SitePresenter/SitePresenter";
import getCatalogEditProps from "@ext/catalog/actions/propsEditor/logic/getCatalogEditProps";
import getRepUrl from "@ext/git/core/GitPathnameHandler/clone/logic/getRepUrl";
import GitShareData from "@ext/git/core/model/GitShareData";
import getPartGitSourceDataByStorageName from "@ext/storage/logic/utils/getPartSourceDataByStorageName";
import { JSONSchema7 } from "json-schema";
import { useEffect, useState } from "react";
import FetchService from "../../../../../ui-logic/ApiServices/FetchService";
import ApiUrlCreatorService from "../../../../../ui-logic/ContextServices/ApiUrlCreator";
import ErrorHandler from "../../../../errorHandlers/client/components/ErrorHandler";
import useLocalize from "../../../../localization/useLocalize";
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
	const maxLength = useLocalize("maxLength");
	const suchCatalogExists = useLocalize("suchCatalogExists");
	const noEncodingSymbolsInUrl = useLocalize("noEncodingSymbolsInUrl");

	const apiUrlCreator = ApiUrlCreatorService.value;
	const [isOpen, setIsOpen] = useState(props.isOpen);
	const [allCatalogNames, setAllCatalogNames] = useState<string[]>([]);

	useEffect(() => setIsOpen(props.isOpen), [props.isOpen]);

	const router = useRouter();
	const articleProps = ArticlePropsService.value;
	const catalogProps = CatalogPropsService.value;
	const [saveProcess, setSaveProcess] = useState(false);

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
		const isNewPath = RouterPathProvider.isNewPath(new Path(router.path).removeExtraSymbols);

		router.pushPath(
			isNewPath
				? RouterPathProvider.updatePathnameData(basePathName, { filePath }).value
				: Path.join(basePathName.value, ...filePath),
		);

		onSubmitParent?.(props);
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
		if (!/^[\w\d\-_]+$/m.test(url)) return noEncodingSymbolsInUrl;
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
					props.onClose?.();
				}}
			>
				<ModalLayoutLight>
					<ErrorHandler>
						<Form<CatalogEditProps>
							leftButton={
								<Button
									style={{ margin: 0 }}
									buttonStyle={ButtonStyle.underline}
									onClick={() => {
										const pathnameData = RouterPathProvider.parsePath(
											new Path(catalogProps.link.pathname),
										);
										const gitShareData: GitShareData = {
											domain: pathnameData.sourceName,
											group: pathnameData.group,
											sourceType: getPartGitSourceDataByStorageName(pathnameData.sourceName)
												.sourceType,
											branch: pathnameData.branch,
											name: pathnameData.repName,
											filePath: "",
										};
										window.open(getRepUrl(gitShareData).href);
									}}
								>
									{useLocalize("openIn") + " " + sourceType}
								</Button>
							}
							schema={Schema as JSONSchema7}
							props={getCatalogEditProps(catalogProps)}
							fieldDirection="row"
							validateDeps={[allCatalogNames]}
							validate={({ url, description, code }) => {
								return {
									url: validateUrl(allCatalogNames, url, suchCatalogExists, noEncodingSymbolsInUrl),
									description: description?.length > 50 ? maxLength + 50 : null,
									code: code?.length > 4 ? maxLength + 4 : null,
								};
							}}
							onSubmit={submit}
							onMount={(_, schema) => {
								schema.properties = {
									title: Schema.properties.title,
									url: Schema.properties.url,
									docroot: Schema.properties.docroot,
									_h2: "Отображение на главной",
									description: Schema.properties.description,
									style: Schema.properties.style,
									code: Schema.properties.code,
									// __h2: "Приватность",
									// private: Schema.properties.private,
								} as any;
							}}
						/>
					</ErrorHandler>
				</ModalLayoutLight>
			</ModalLayout>
		</>
	);
};

export default CatalogPropsEditor;
