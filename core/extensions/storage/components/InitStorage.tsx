import { useCatalogPropsStore } from "@core-ui/stores/CatalogPropsStore/CatalogPropsStore.provider";
import { useRouter } from "@core/Api/useRouter";
import Path from "@core/FileProvider/Path/Path";
import OnNetworkApiErrorService from "@ext/errorHandlers/client/OnNetworkApiErrorService";
import GitStorageData from "@ext/git/core/model/GitStorageData";
import t from "@ext/localization/locale/translate";
import SelectStorageDataForm from "@ext/storage/components/SelectStorageDataForm";
import { Modal, ModalContent, ModalTrigger } from "@ui-kit/Modal";
import { useState } from "react";
import FetchService from "../../../ui-logic/ApiServices/FetchService";
import MimeTypes from "../../../ui-logic/ApiServices/Types/MimeTypes";
import ApiUrlCreatorService from "../../../ui-logic/ContextServices/ApiUrlCreator";
import SourceType from "@ext/storage/logic/SourceDataProvider/model/SourceType";
import GithubStorageData from "@ext/git/actions/Source/GitHub/model/GithubStorageData";

const InitStorage = ({ trigger }: { trigger: JSX.Element }) => {
	const catalogName = useCatalogPropsStore((state) => state.data.name);
	const apiUrlCreator = ApiUrlCreatorService.value;
	const router = useRouter();

	const [isOpen, setIsOpen] = useState(false);

	const onSubmit = async (data: GitStorageData) => {
		const group = Path.join(data.group, data.name);
		const name = catalogName;

		const isGithub = data.source.sourceType === SourceType.gitHub;
		const additional = isGithub ? { type: (data as GithubStorageData).type } : {};

		const newData = { source: data.source, group, name, ...additional };
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
