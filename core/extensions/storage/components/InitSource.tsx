import ModalToOpenService from "@core-ui/ContextServices/ModalToOpenService/ModalToOpenService";
import ModalToOpen from "@core-ui/ContextServices/ModalToOpenService/model/ModalsToOpen";
import { useCatalogPropsStore } from "@core-ui/stores/CatalogPropsStore/CatalogPropsStore.provider";
import t from "@ext/localization/locale/translate";
import type CreateStorage from "@ext/storage/components/CreateStorage";
import { Button } from "@ui-kit/Button";
import { Dialog, DialogBody, DialogContent, DialogTrigger } from "@ui-kit/Dialog";
import { FormFooter, FormHeader } from "@ui-kit/Form";
import { Label } from "@ui-kit/Label";
import { type ComponentProps, useState } from "react";
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
		<Dialog onOpenChange={setIsOpen} open={isOpen}>
			<DialogTrigger asChild>{trigger}</DialogTrigger>
			<DialogContent data-modal-root>
				<FormHeader title={t("catalog.catalog-already-linked.name")} />
				<DialogBody>
					<Label>{t("catalog.catalog-already-linked.description")}</Label>
				</DialogBody>
				<FormFooter
					primaryButton={<Button onClick={handleAddStorage}>{t("add-storage")}</Button>}
					secondaryButton={
						<Button onClick={() => setIsOpen(false)} variant="outline">
							{t("continue-locally")}
						</Button>
					}
				/>
			</DialogContent>
		</Dialog>
	);
};

export default InitSource;
