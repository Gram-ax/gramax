import Form, { FormSchema } from "@components/Form/Form";
import ModalLayout from "@components/Layouts/Modal";
import ModalLayoutLight from "@components/Layouts/ModalLayoutLight";
import { JSONSchema7 } from "json-schema";
import ErrorHandler from "../../../../errorHandlers/client/components/ErrorHandler";
import Schema from "../model/CatalogCreateProps.schema.json";
import CatalogCreateProps from "@ext/catalog/actions/propsEditor/model/CatalogCreateProps.schema";
import { useMemo, useState } from "react";
import Field from "@components/Form/Field";
import Button from "@components/Atoms/Button/Button";
import { ButtonStyle } from "@components/Atoms/Button/ButtonStyle";
import t from "@ext/localization/locale/translate";
import generateUniqueID from "@core/utils/generateUniqueID";
import { Property } from "@ext/properties/models";

interface CreatePropsModal {
	data: Property;
	isOpen: boolean;
	closeModal: () => void;
	onSubmit: (values, isDelete?: boolean) => void;
}

const CreateProps = ({ isOpen, closeModal, onSubmit, data }: CreatePropsModal) => {
	const [editProps, setEditProps] = useState(data || { id: generateUniqueID(), name: "", type: null, values: null });
	const editSchema = useMemo(() => ({ ...Schema }), []);

	const onChange = (props) => {
		setEditProps(props);
	};

	const submit = (isDelete: boolean = false) => {
		onSubmit(editProps, isDelete);
		closeModal();
	};

	return (
		<ModalLayout isOpen={isOpen} closeOnCmdEnter={false} onClose={() => closeModal()}>
			<ModalLayoutLight>
				<ErrorHandler>
					<Form<CatalogCreateProps>
						schema={editSchema as JSONSchema7}
						props={editProps}
						fieldDirection="row"
						leftButton={
							data && (
								<Button buttonStyle={ButtonStyle.underline} onClick={() => submit(true)}>
									{t("delete")}
								</Button>
							)
						}
						onChange={onChange}
						onSubmit={() => submit()}
						onMount={(_, schema) => {
							schema.properties = {
								name: Schema.properties.name,
								type: Schema.properties.type,
								style: Schema.properties.style,
							} as any;
							(schema.properties.type as any).readOnly = !!editProps.type;
						}}
					>
						{editProps?.type === "Enum" && (
							<Field
								translationKey={"values"}
								formTranslationKey={"catalog-create-props"}
								scheme={Schema.properties.values as FormSchema}
								value={editProps?.values}
								tabIndex={5}
								onChange={(values: string[]) => {
									const newProps = { ...editProps, values };
									setEditProps(newProps);
								}}
							/>
						)}
					</Form>
				</ErrorHandler>
			</ModalLayoutLight>
		</ModalLayout>
	);
};

export default CreateProps;
