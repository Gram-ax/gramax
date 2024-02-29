import Button from "@components/Atoms/Button/Button";
import { ButtonStyle } from "@components/Atoms/Button/ButtonStyle";
import CustomArticle from "@components/CustomArticle";
import FormStyle from "@components/Form/FormStyle";
import ModalLayout from "@components/Layouts/Modal";
import ModalLayoutLight from "@components/Layouts/ModalLayoutLight";
import { useState } from "react";
import CatalogPropsService from "../../../ui-logic/ContextServices/CatalogProps";
import useLocalize from "../../localization/useLocalize";
import CreateSourceData from "../logic/SourceDataProvider/components/CreateSourceData";
import getPartGitSourceDataByStorageName from "../logic/utils/getPartSourceDataByStorageName";

const InitSource = ({ trigger }: { trigger: JSX.Element }) => {
	const [isOpen, setIsOpen] = useState(false);
	const sourceName = CatalogPropsService.value.sourceName;
	const { sourceType, data } = getPartGitSourceDataByStorageName(sourceName);

	return (
		<ModalLayout trigger={trigger} isOpen={isOpen} onOpen={() => setIsOpen(true)} onClose={() => setIsOpen(false)}>
			<ModalLayoutLight>
				<FormStyle>
					<>
						<CustomArticle name="initSource" setLayout={false} />
						<div className="buttons">
							<Button buttonStyle={ButtonStyle.underline} onClick={() => setIsOpen(false)}>
								{useLocalize("continueLocally")}
							</Button>
							<CreateSourceData
								defaultSourceData={data}
								defaultSourceType={sourceType}
								trigger={<Button>{useLocalize("addStorage")}</Button>}
							/>
						</div>
					</>
				</FormStyle>
			</ModalLayoutLight>
		</ModalLayout>
	);
};

export default InitSource;
