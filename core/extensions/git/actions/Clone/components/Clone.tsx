import Button from "@components/Atoms/Button/Button";
import CircularProgressbar from "@components/Atoms/CircularProgressbar";
import FormStyle from "@components/Form/FormStyle";
import ModalLayout from "@components/Layouts/Modal";
import ModalLayoutLight from "@components/Layouts/ModalLayoutLight";
import ErrorForm from "@ext/errorHandlers/client/components/ErrorForm";
import { useState } from "react";
import { useRouter } from "../../../../../logic/Api/useRouter";
import ApiUrlCreatorService from "../../../../../ui-logic/ContextServices/ApiUrlCreator";
import useLocalize from "../../../../localization/useLocalize";
import SelectStorageDataForm from "../../../../storage/components/SelectStorageDataForm";
import Progress from "../../../../storage/models/Progress";
import StorageData from "../../../../storage/models/StorageData";
import cloneHandler from "../logic/cloneHandler";
import verifyCatalog from "../logic/verifyCatalog";

enum CloneStage {
	AskForStorage,
	AskForCreate,
	Cloning,
}

const CloneProgressForm = (props: { progress?: Progress }) => (
	<FormStyle>
		<>
			<legend>{useLocalize("loading2")}</legend>
			<CircularProgressbar value={props.progress?.percent} />
		</>
	</FormStyle>
);

const SelectStorageForm = (props: {
	onSetStorage: (data: StorageData) => void;
	startClone: () => void;
	disabled: boolean;
}) => (
	<SelectStorageDataForm
		forClone
		onChange={props.onSetStorage}
		title={`${useLocalize("load")} ${useLocalize("existing")} ${useLocalize("catalog2")}`}
	>
		<div className="buttons">
			<Button disabled={props.disabled} onClick={props.startClone}>
				{useLocalize("load")}
			</Button>
		</div>
	</SelectStorageDataForm>
);

const AskForCreate = ({ onConfirm, onCancel }: { onConfirm: () => void; onCancel: () => void }) => {
	return (
		<ErrorForm
			title={useLocalize("confirmCreateCatalogOnCloneHeader")}
			onCancelClick={onCancel}
			closeButton={{ text: useLocalize("cancel") }}
			actionButton={{ text: useLocalize("createNew2"), onClick: onConfirm }}
		>
			<span>{useLocalize("confirmCreateCatalogOnClone")}</span>
		</ErrorForm>
	);
};

const Clone = ({ trigger }: { trigger: JSX.Element }) => {
	const router = useRouter();
	const [stage, setStage] = useState(CloneStage.AskForStorage);
	const [isOpen, setIsOpen] = useState(false);
	const [progress, setProgress] = useState<Progress>(null);
	const [storageData, setStorageData] = useState<StorageData>(null);
	const apiUrlCreator = ApiUrlCreatorService.value;

	const disable = !storageData || Object.values(storageData).some((v) => !v);

	const closeForm = () => {
		setStage(CloneStage.AskForStorage);
		setIsOpen(false);
		setStorageData(null);
	};

	const checkForCatalogAndClone = async () => {
		setStage(CloneStage.Cloning);
		if (await verifyCatalog(storageData, apiUrlCreator)) return await startClone();
		setStage(CloneStage.AskForCreate);
	};

	const startClone = async () => {
		const path = await cloneHandler({
			storageData,
			apiUrlCreator,
			skipCheck: true,
			onStart: () => setStage(CloneStage.Cloning),
			onProgress: setProgress,
		});
		path ? router.pushPath(path) : closeForm();
	};

	return (
		<ModalLayout
			isOpen={isOpen}
			onOpen={() => setIsOpen(true)}
			onClose={closeForm}
			onCmdEnter={checkForCatalogAndClone}
			trigger={trigger}
		>
			<ModalLayoutLight>
				{stage == CloneStage.AskForStorage && (
					<SelectStorageForm
						onSetStorage={setStorageData}
						startClone={checkForCatalogAndClone}
						disabled={disable}
					/>
				)}
				{stage == CloneStage.AskForCreate && (
					<AskForCreate onCancel={() => setStage(CloneStage.AskForStorage)} onConfirm={startClone} />
				)}
				{stage == CloneStage.Cloning && <CloneProgressForm progress={progress} />}
			</ModalLayoutLight>
		</ModalLayout>
	);
};

export default Clone;
