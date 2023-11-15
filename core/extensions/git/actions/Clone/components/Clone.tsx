import Button from "@components/Atoms/Button/Button";
import CircularProgressbar from "@components/Atoms/CircularProgressbar";
import FormStyle from "@components/Form/FormStyle";
import ModalLayout from "@components/Layouts/Modal";
import ModalLayoutLight from "@components/Layouts/ModalLayoutLight";
import { useState } from "react";
import { useRouter } from "../../../../../logic/Api/useRouter";
import ApiUrlCreatorService from "../../../../../ui-logic/ContextServices/ApiUrlCreator";
import useLocalize from "../../../../localization/useLocalize";
import SelectStorageDataForm from "../../../../storage/components/SelectStorageDataForm";
import Progress from "../../../../storage/models/Progress";
import StorageData from "../../../../storage/models/StorageData";
import cloneHandler from "../logic/cloneHandler";

const Clone = ({ trigger }: { trigger: JSX.Element }) => {
	const router = useRouter();
	const [start, setStart] = useState(false);
	const [isOpen, setIsOpen] = useState(false);
	const [progress, setProgress] = useState<Progress>(null);
	const [storageData, setStorageData] = useState<StorageData>(null);
	const apiUrlCreator = ApiUrlCreatorService.value;

	const disable = !storageData || Object.values(storageData).some((v) => !v);

	const close = () => {
		setStart(false);
		setIsOpen(false);
		setStorageData(null);
	};

	const clone = async () => {
		const path = await cloneHandler({
			storageData,
			apiUrlCreator,
			onStart: setStart,
			onProgress: setProgress,
		});
		if (path) router.pushPath(path);
		else close();
	};

	return (
		<ModalLayout
			isOpen={isOpen}
			onOpen={() => setIsOpen(true)}
			onClose={close}
			onCmdEnter={clone}
			trigger={trigger}
		>
			<ModalLayoutLight>
				{start ? (
					<FormStyle>
						<>
							<legend>{useLocalize("loading2")}</legend>
							<CircularProgressbar value={progress?.percent} />
						</>
					</FormStyle>
				) : (
					<SelectStorageDataForm
						forClone
						onChange={setStorageData}
						title={`${useLocalize("load")} ${useLocalize("existing")} ${useLocalize("catalog2")}`}
					>
						<div className="buttons">
							<Button disabled={disable} onClick={clone}>
								{useLocalize("load")}
							</Button>
						</div>
					</SelectStorageDataForm>
				)}
			</ModalLayoutLight>
		</ModalLayout>
	);
};

export default Clone;
