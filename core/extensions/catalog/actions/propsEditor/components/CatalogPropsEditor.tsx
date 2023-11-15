import Form from "@components/Form/Form";
import ModalLayout from "@components/Layouts/Modal";
import ModalLayoutLight from "@components/Layouts/ModalLayoutLight";
import { JSONSchema7 } from "json-schema";
import { useState } from "react";
import FetchService from "../../../../../ui-logic/ApiServices/FetchService";
import ApiUrlCreatorService from "../../../../../ui-logic/ContextServices/ApiUrlCreator";
import ErrorHandler from "../../../../errorHandlers/client/components/ErrorHandler";
import useLocalize from "../../../../localization/useLocalize";
import CatalogEditProps from "../model/CatalogEditProps.schema";
import Schema from "../model/CatalogEditProps.schema.json";

const CatalogPropsEditor = ({
	trigger,
	onSubmit,
	catalogProps,
	leftButton,
}: {
	onSubmit?: (editProps: any) => void;
	trigger: JSX.Element;
	catalogProps: CatalogEditProps;
	leftButton?: JSX.Element;
}) => {
	const maxLength = useLocalize("maxLength");
	const suchCatalogExists = useLocalize("suchCatalogExists");
	const noEncodingSymbolsInUrl = useLocalize("noEncodingSymbolsInUrl");

	const apiUrlCreator = ApiUrlCreatorService.value;
	const [isOpen, setIsOpen] = useState(false);
	const [allCatalogNames, setAllCatalogNames] = useState<string[]>([]);
	const [currentCatalogProps, setCurrentCatalogProps] = useState<CatalogEditProps>(catalogProps);

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
		<ModalLayout
			trigger={trigger}
			isOpen={isOpen}
			closeOnCmdEnter={false}
			onOpen={() => {
				setCurrentCatalogProps(catalogProps);
				loadAllCatalogNames();
				setIsOpen(true);
			}}
			onClose={() => setIsOpen(false)}
		>
			<ModalLayoutLight>
				<ErrorHandler>
					<Form<CatalogEditProps>
						leftButton={leftButton}
						schema={Schema as JSONSchema7}
						props={currentCatalogProps}
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
								_h2: "Отображение на главной",
								description: Schema.properties.description,
								style: Schema.properties.style,
								code: Schema.properties.code,
								__h2: "Приватность",
								private: Schema.properties.private,
							} as any;
						}}
					/>
				</ErrorHandler>
			</ModalLayoutLight>
		</ModalLayout>
	);
};

export default CatalogPropsEditor;
