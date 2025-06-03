import Chip from "@components/Atoms/Chip";
import Icon from "@components/Atoms/Icon";
import PopupMenuLayout from "@components/Layouts/PopupMenuLayout";
import FetchService from "@core-ui/ApiServices/FetchService";
import ApiUrlCreatorService from "@core-ui/ContextServices/ApiUrlCreator";
import ModalToOpenService from "@core-ui/ContextServices/ModalToOpenService/ModalToOpenService";
import ModalToOpen from "@core-ui/ContextServices/ModalToOpenService/model/ModalsToOpen";
import styled from "@emotion/styled";
import t from "@ext/localization/locale/translate";
import PropertyItem from "@ext/properties/components/PropertyItem";
import { PropertySettingsProps } from "@ext/templates/components/Properties/PropertySettings";
import TemplateService from "@ext/templates/components/TemplateService";
import { combineCustomProperties } from "@ext/templates/logic/utils";
import { TemplateCustomProperty } from "@ext/templates/models/types";

interface TemplatePropertySettingsProps {
	templateId: string;
}

const Wrapper = styled.div`
	display: flex;
	flex-direction: row-reverse;
	align-items: center;
	font-size: 0.7em;
	gap: 1rem;
`;

const TemplatePropertySettings = ({ templateId }: TemplatePropertySettingsProps) => {
	const { properties } = TemplateService.value;
	const apiUrlCreator = ApiUrlCreatorService.value;

	const saveCustomProperty = async (property: TemplateCustomProperty) => {
		const url = apiUrlCreator.saveTemplateCustomProperty(templateId);
		await FetchService.fetch(url, JSON.stringify(property));
		TemplateService.setProperties(combineCustomProperties([...properties.values(), property], properties));
	};

	const openPropertySettings = (property?: TemplateCustomProperty) => {
		ModalToOpenService.setValue<PropertySettingsProps>(ModalToOpen.TemplatePropertySettings, {
			properties: Array.from(properties.values()),
			property,
			onSubmit: (property: TemplateCustomProperty) => {
				saveCustomProperty(property);
				ModalToOpenService.resetValue();
			},
			onClose: () => {
				ModalToOpenService.resetValue();
			},
		});
	};

	const createNew = () => {
		openPropertySettings();
	};

	return (
		<Wrapper>
			<PopupMenuLayout
				trigger={<Chip icon="list-plus" chipStyle="none" dataQa="qa-add-property" style={{ height: "1em" }} />}
			>
				<>
					{Array.from(properties.values()).map((property) => {
						return (
							<PropertyItem
								id={property.name}
								key={property.name}
								name={property.name}
								startIcon={property.icon}
								values={property.values}
								closeOnSelection={false}
								rightActions={
									<Icon isAction code="pen" onClick={() => openPropertySettings(property)} />
								}
							/>
						);
					})}
					{properties.size && <div className="divider" />}
					<PropertyItem id={null} name={t("create-new")} startIcon="plus" onClick={createNew} />
				</>
			</PopupMenuLayout>
		</Wrapper>
	);
};

export default TemplatePropertySettings;
