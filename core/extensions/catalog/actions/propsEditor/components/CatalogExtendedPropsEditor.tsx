import SpinnerLoader from "@components/Atoms/SpinnerLoader";
import Form from "@components/Form/Form";
import LogsLayout from "@components/Layouts/LogsLayout";
import ModalLayout from "@components/Layouts/Modal";
import ModalLayoutLight from "@components/Layouts/ModalLayoutLight";
import { ReactElement, useState } from "react";
import Schema from "../model/CatalogExtendedEditProps.schema.json";
import CatalogExtendedEditProps from "@ext/catalog/actions/propsEditor/model/CatalogExtendedEditProps.schema";
import { JSONSchema7 } from "json-schema";
import ApiUrlCreatorService from "@core-ui/ContextServices/ApiUrlCreator";
import FetchService from "@core-ui/ApiServices/FetchService";
import CatalogPropsService from "@core-ui/ContextServices/CatalogProps";
import t from "@ext/localization/locale/translate";

const CatalogExtendedPropsEditor = ({ children }: { children: ReactElement }) => {
	const [isOpen, setIsOpen] = useState(false);
	const [isSettingSyntax, setIsSettingSyntax] = useState(false);
	const apiUrlCreator = ApiUrlCreatorService.value;
	const catalogProps = CatalogPropsService.value;

	const setSyntax = async ({ syntax }: CatalogExtendedEditProps) => {
		setIsSettingSyntax(true);
		await FetchService.fetch(apiUrlCreator.setSyntax(syntax));
		CatalogPropsService.value = { ...catalogProps, syntax };
		setIsSettingSyntax(false);
		setIsOpen(false);
	};

	return (
		<>
			<ModalLayout isOpen={isSettingSyntax}>
				<LogsLayout style={{ overflow: "hidden" }}>
					<SpinnerLoader fullScreen />
				</LogsLayout>
			</ModalLayout>
			<ModalLayout
				trigger={children}
				isOpen={isOpen}
				closeOnCmdEnter={false}
				onOpen={() => {
					setIsOpen(true);
				}}
				onClose={() => {
					setIsOpen(false);
				}}
			>
				<ModalLayoutLight>
					<Form<CatalogExtendedEditProps>
						fieldDirection="row"
						schema={Schema as JSONSchema7}
						props={{ syntax: catalogProps.syntax }}
						onSubmit={setSyntax}
						submitText={t("reformat")}
					></Form>
				</ModalLayoutLight>
			</ModalLayout>
		</>
	);
};

export default CatalogExtendedPropsEditor;
