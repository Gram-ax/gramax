import { ComponentProps, useState } from "react";
import SourceData from "../logic/SourceDataProvider/model/SourceData";
import ApiUrlCreator from "@core-ui/ContextServices/ApiUrlCreator";
import FetchService from "@core-ui/ApiServices/FetchService";
import MimeTypes from "@core-ui/ApiServices/Types/MimeTypes";
import SourceDataService from "@core-ui/ContextServices/SourceDataService";
import getStorageNameByData from "../logic/utils/getStorageNameByData";
import CreateStorage from "@ext/storage/components/CreateStorage";

interface CreateStorageModalProps extends Omit<ComponentProps<typeof CreateStorage>, "onSubmit"> {
	onSubmit: (data: SourceData) => void;
}

const CreateStorageModal = ({ onSubmit, onClose, ...props }: CreateStorageModalProps) => {
	const [isOpen, setIsOpen] = useState(true);
	const apiUrlCreator = ApiUrlCreator.value;
	const sourceDatas = SourceDataService.value;

	const handleCreateStorage = async (data: SourceData): Promise<string> => {
		const url = apiUrlCreator.setSourceData();
		const res = await FetchService.fetch(url, JSON.stringify(data), MimeTypes.json);
		if (!res.ok) return;

		const newSourceDatas = [...sourceDatas, data];
		SourceDataService.value = newSourceDatas;

		const storageKey = getStorageNameByData(data);
		return storageKey;
	};

	const preSubmitStorage = async (data: SourceData) => {
		await handleCreateStorage(data);
		onSubmit?.(data);
	};

	return (
		<CreateStorage onSubmit={preSubmitStorage} onClose={onClose} isOpen={isOpen} setIsOpen={setIsOpen} {...props} />
	);
};

export default CreateStorageModal;
