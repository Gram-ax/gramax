import Button from "@components/Atoms/Button/Button";
import SpinnerLoader from "@components/Atoms/SpinnerLoader";
import FormStyle from "@components/Form/FormStyle";
import ModalLayout from "@components/Layouts/Modal";
import ModalLayoutLight from "@components/Layouts/ModalLayoutLight";
import { useRouter } from "@core/Api/useRouter";
import t from "@ext/localization/locale/translate";
import { useState } from "react";
import FetchService from "../../../ui-logic/ApiServices/FetchService";
import MimeTypes from "../../../ui-logic/ApiServices/Types/MimeTypes";
import ApiUrlCreatorService from "../../../ui-logic/ContextServices/ApiUrlCreator";
import CatalogPropsService from "../../../ui-logic/ContextServices/CatalogProps";
import StorageData from "../models/StorageData";
import SelectStorageDataForm from "./SelectStorageDataForm";

const InitStorage = ({ trigger }: { trigger: JSX.Element }) => {
	const catalogProps = CatalogPropsService.value;
	const apiUrlCreator = ApiUrlCreatorService.value;
	const router = useRouter();

	const [load, setLoad] = useState(false);
	const [isOpen, setIsOpen] = useState(false);
	const [storageData, setStorageData] = useState<StorageData>(null);

	const onSelect = async (data: StorageData) => {
		if (!data) return;
		setLoad(true);
		const res = await FetchService.fetch(apiUrlCreator.initStorage(), JSON.stringify(data), MimeTypes.json);
		setLoad(false);
		if (res.ok) router.pushPath(await res.text());
		setIsOpen(false);
	};

	return (
		<ModalLayout trigger={trigger} isOpen={isOpen} onOpen={() => setIsOpen(true)} onClose={() => setIsOpen(false)}>
			<ModalLayoutLight>
				{!load ? (
					<SelectStorageDataForm title={t("connect-storage")} onChange={setStorageData}>
						<div className="buttons">
							<Button
								disabled={
									!storageData ||
									Object.keys(storageData)
										.filter((n) => n != "name")
										.some((n) => !storageData[n])
								}
								onClick={() => onSelect({ ...storageData, name: catalogProps.name })}
							>
								{t("select")}
							</Button>
						</div>
					</SelectStorageDataForm>
				) : (
					<FormStyle>
						<SpinnerLoader fullScreen />
					</FormStyle>
				)}
			</ModalLayoutLight>
		</ModalLayout>
	);
};

export default InitStorage;
