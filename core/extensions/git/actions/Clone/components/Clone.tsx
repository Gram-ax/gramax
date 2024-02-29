import Button from "@components/Atoms/Button/Button";
import FormStyle from "@components/Form/FormStyle";
import ModalLayout from "@components/Layouts/Modal";
import ModalLayoutLight from "@components/Layouts/ModalLayoutLight";
import { useRouter } from "@core/Api/useRouter";
import CloneProgressbar from "@ext/git/actions/Clone/components/CloneProgressbar";
import { ReactNode, useState } from "react";
import useLocalize from "../../../../localization/useLocalize";
import SelectStorageDataForm from "../../../../storage/components/SelectStorageDataForm";
import StorageData from "../../../../storage/models/StorageData";

enum CloneStage {
	AskForStorage,
	Cloning,
}

const LoadingLayout = ({ children }: { children: ReactNode }) => {
	return (
		<FormStyle>
			<>
				<legend>{useLocalize("loading2")}</legend>
				{children}
			</>
		</FormStyle>
	);
};

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

const Clone = ({ trigger }: { trigger: JSX.Element }) => {
	const router = useRouter();
	const [stage, setStage] = useState(CloneStage.AskForStorage);
	const [isOpen, setIsOpen] = useState(false);
	const [storageData, setStorageData] = useState<StorageData>(null);

	const disable = !storageData || Object.values(storageData).some((v) => !v);

	const closeForm = () => {
		setStage(CloneStage.AskForStorage);
		setIsOpen(false);
		setStorageData(null);
	};

	const startClone = () => {
		setStage(CloneStage.Cloning);
	};

	return (
		<ModalLayout
			isOpen={isOpen}
			onOpen={() => setIsOpen(true)}
			onClose={closeForm}
			onCmdEnter={startClone}
			trigger={trigger}
		>
			<ModalLayoutLight>
				{stage === CloneStage.AskForStorage && (
					<SelectStorageForm onSetStorage={setStorageData} startClone={startClone} disabled={disable} />
				)}
				{stage === CloneStage.Cloning && (
					<LoadingLayout>
						<CloneProgressbar
							triggerClone={true}
							storageData={storageData}
							skipCheck={true}
							onFinish={(path) => {
								router.pushPath(path);
							}}
							onError={closeForm}
						/>
					</LoadingLayout>
				)}
			</ModalLayoutLight>
		</ModalLayout>
	);
};

export default Clone;
