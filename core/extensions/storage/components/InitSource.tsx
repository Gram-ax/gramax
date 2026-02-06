import ModalToOpenService from "@core-ui/ContextServices/ModalToOpenService/ModalToOpenService";
import ModalToOpen from "@core-ui/ContextServices/ModalToOpenService/model/ModalsToOpen";
import { useCatalogPropsStore } from "@core-ui/stores/CatalogPropsStore/CatalogPropsStore.provider";
import t from "@ext/localization/locale/translate";
import CreateStorage from "@ext/storage/components/CreateStorage";
import { Button } from "@ui-kit/Button";
import { FormFooter, FormHeader } from "@ui-kit/Form";
import { Label } from "@ui-kit/Label";
import { Modal, ModalBody, ModalContent, ModalTrigger } from "@ui-kit/Modal";
import { ComponentProps, useState } from "react";
import getPartGitSourceDataByStorageName from "../logic/utils/getPartSourceDataByStorageName";

const InitSource = ({ trigger }: { trigger: JSX.Element }) => {
	const [isOpen, setIsOpen] = useState(false);
	const sourceName = useCatalogPropsStore((state) => state.data.sourceName);
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
		<Modal onOpenChange={setIsOpen} open={isOpen}>
			<ModalTrigger asChild>{trigger}</ModalTrigger>
			<ModalContent data-modal-root>
				<FormHeader title={t("catalog.catalog-already-linked.name")} />
				<ModalBody>
					<Label>{t("catalog.catalog-already-linked.description")}</Label>
				</ModalBody>
				<FormFooter
					primaryButton={<Button onClick={handleAddStorage}>{t("add-storage")}</Button>}
					secondaryButton={
						<Button onClick={() => setIsOpen(false)} variant="outline">
							{t("continue-locally")}
						</Button>
					}
				/>
			</ModalContent>
		</Modal>
	);
};

export default InitSource;
