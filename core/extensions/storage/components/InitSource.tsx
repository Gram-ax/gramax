import Button from "@components/Atoms/Button/Button";
import { ButtonStyle } from "@components/Atoms/Button/ButtonStyle";
import CustomArticle from "@components/CustomArticle";
import FormStyle from "@components/Form/FormStyle";
import ModalLayout from "@components/Layouts/Modal";
import ModalLayoutLight from "@components/Layouts/ModalLayoutLight";
import OnNetworkApiErrorService from "@ext/errorHandlers/client/OnNetworkApiErrorService";
import t from "@ext/localization/locale/translate";
import { useState } from "react";
import CatalogPropsService from "../../../ui-logic/ContextServices/CatalogProps";
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
								{t("continue-locally")}
							</Button>
							<OnNetworkApiErrorService.Provider
								callback={() => {
									setIsOpen(false);
								}}
							>
								<CreateSourceData
									defaultSourceData={data}
									defaultSourceType={sourceType}
									onCreate={() => {
										setIsOpen(false);
										refreshPage();
									}}
									trigger={<Button>{t("add-storage")}</Button>}
								/>
							</OnNetworkApiErrorService.Provider>
						</div>
					</>
				</FormStyle>
			</ModalLayoutLight>
		</ModalLayout>
	);
};

export default InitSource;
