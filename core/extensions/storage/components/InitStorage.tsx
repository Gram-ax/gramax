import { useRouter } from "@core/Api/useRouter";
import OnNetworkApiErrorService from "@ext/errorHandlers/client/OnNetworkApiErrorService";
import t from "@ext/localization/locale/translate";
import { useState } from "react";
import FetchService from "../../../ui-logic/ApiServices/FetchService";
import MimeTypes from "../../../ui-logic/ApiServices/Types/MimeTypes";
import ApiUrlCreatorService from "../../../ui-logic/ContextServices/ApiUrlCreator";
import CatalogPropsService from "../../../ui-logic/ContextServices/CatalogProps";
import StorageData from "../models/StorageData";
import { Modal, ModalContent, ModalTrigger } from "@ui-kit/Modal";
import SelectStorageDataForm from "@ext/storage/components/SelectStorageDataForm";

const InitStorage = ({ trigger }: { trigger: JSX.Element }) => {
	const catalogProps = CatalogPropsService.value;
	const apiUrlCreator = ApiUrlCreatorService.value;
	const router = useRouter();

	const [isOpen, setIsOpen] = useState(false);

	const onSubmit = async (data: StorageData) => {
		const group = data.name;
		const name = catalogProps.name;
		const newData = { ...data, group, name };
		if (!newData) return;

		const res = await FetchService.fetch(apiUrlCreator.initStorage(), JSON.stringify(newData), MimeTypes.json);
		if (res.ok) router.pushPath(await res.text());
		setIsOpen(false);
		return res.ok;
	};

	return (
		<Modal open={isOpen} onOpenChange={setIsOpen}>
			<ModalTrigger asChild>{trigger}</ModalTrigger>
			<ModalContent>
				<OnNetworkApiErrorService.Provider callback={() => setIsOpen(false)}>
					<SelectStorageDataForm mode="init" onSubmit={onSubmit} title={t("connect-storage")} />
				</OnNetworkApiErrorService.Provider>
			</ModalContent>
		</Modal>
	);
};

export default InitStorage;
