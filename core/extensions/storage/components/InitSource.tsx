import t from "@ext/localization/locale/translate";
import { ComponentProps, useState } from "react";
import CatalogPropsService from "@core-ui/ContextServices/CatalogProps";
import getPartGitSourceDataByStorageName from "../logic/utils/getPartSourceDataByStorageName";
import { Modal, ModalContent, ModalBody, ModalTrigger } from "@ui-kit/Modal";
import { FormFooter, FormHeader } from "@ui-kit/Form";
import { Button } from "@ui-kit/Button";
import { Label } from "@ui-kit/Label";
import ModalToOpenService from "@core-ui/ContextServices/ModalToOpenService/ModalToOpenService";
import ModalToOpen from "@core-ui/ContextServices/ModalToOpenService/model/ModalsToOpen";
import CreateStorage from "@ext/storage/components/CreateStorage";

const InitSource = ({ trigger }: { trigger: JSX.Element }) => {
	const [isOpen, setIsOpen] = useState(false);
	const sourceName = CatalogPropsService.value.sourceName;
	const { sourceType, data } = getPartGitSourceDataByStorageName(sourceName);

	const handleAddStorage = () => {
		ModalToOpenService.setValue<ComponentProps<typeof CreateStorage>>(ModalToOpen.CreateStorage, {
			data: data,
			isReadonly: true,
			sourceType: sourceType,
			onSubmit: () => {
				ModalToOpenService.resetValue();
				refreshPage();
			},
			onClose: () => ModalToOpenService.resetValue(),
		});
		setIsOpen(false);
	};

	return (
		<Modal open={isOpen} onOpenChange={setIsOpen}>
			<ModalTrigger asChild>{trigger}</ModalTrigger>
			<ModalContent data-modal-root>
				<FormHeader title={t("catalog.catalog-already-linked.name")} />
				<ModalBody>
					<Label>{t("catalog.catalog-already-linked.description")}</Label>
				</ModalBody>
				<FormFooter
					primaryButton={<Button onClick={handleAddStorage}>{t("add-storage")}</Button>}
					secondaryButton={
						<Button variant="outline" onClick={() => setIsOpen(false)}>
							{t("continue-locally")}
						</Button>
					}
				/>
			</ModalContent>
		</Modal>
	);
};

export default InitSource;
