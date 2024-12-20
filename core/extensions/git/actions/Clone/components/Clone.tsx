import { getExecutingEnvironment } from "@app/resolveModule/env";
import Button from "@components/Atoms/Button/Button";
import SpinnerLoader from "@components/Atoms/SpinnerLoader";
import FormStyle from "@components/Form/FormStyle";
import ModalLayout from "@components/Layouts/Modal";
import ModalLayoutLight from "@components/Layouts/ModalLayoutLight";
import FetchService from "@core-ui/ApiServices/FetchService";
import ApiUrlCreatorService from "@core-ui/ContextServices/ApiUrlCreator";
import LanguageService from "@core-ui/ContextServices/Language";
import OnNetworkApiErrorService from "@ext/errorHandlers/client/OnNetworkApiErrorService";
import cloneHandler from "@ext/git/actions/Clone/logic/cloneHandler";
import Mode from "@ext/git/actions/Clone/model/Mode";
import UnsupportedElementsModal from "@ext/import/components/UnsupportedElementsModal";
import UnsupportedElements from "@ext/import/model/UnsupportedElements";
import t from "@ext/localization/locale/translate";
import SourceType from "@ext/storage/logic/SourceDataProvider/model/SourceType";
import { useMemo, useState } from "react";
import SelectStorageDataForm from "../../../../storage/components/SelectStorageDataForm";
import StorageData from "../../../../storage/models/StorageData";

enum CloneStage {
	AskForStorage,
	LoadUnsupportedElements,
	AskToImport,
}

interface SelectStorageFormProps {
	onSetStorage: (data: StorageData) => void;
	startClone: () => void;
	disabled: boolean;
	mode: Mode;
	title: string;
	buttonText: string;
	loadUnsupportedElements: () => void;
}

const LoadingLayout = ({ title, children }: { title?: string; children: React.ReactNode }) => (
	<FormStyle>
		<>
			<legend>{title || t("loading2")}</legend>
			{children}
		</>
	</FormStyle>
);

const SelectStorageForm = (props: SelectStorageFormProps) => {
	const actions = {
		[Mode.clone]: props.startClone,
		[Mode.import]: props.loadUnsupportedElements,
	};

	return (
		<SelectStorageDataForm mode={props.mode} onChange={props.onSetStorage} title={props.title}>
			<div className="buttons">
				<Button disabled={props.disabled} onClick={actions[props.mode]}>
					{props.buttonText}
				</Button>
			</div>
		</SelectStorageDataForm>
	);
};

const Clone = ({ trigger, mode }: { trigger: JSX.Element; mode: Mode }) => {
	const [stage, setStage] = useState(CloneStage.AskForStorage);
	const [isOpen, setIsOpen] = useState(false);
	const [storageData, setStorageData] = useState<StorageData>(null);
	const [unsupportedElements, setUnsupportedElements] = useState<UnsupportedElements[]>([]);
	const apiUrlCreator = ApiUrlCreatorService.value;

	const disable = !storageData || Object.values(storageData).some((v) => !v);

	const closeForm = () => {
		setStage(CloneStage.AskForStorage);
		setIsOpen(false);
		setStorageData(null);
	};

	const startClone = () => {
		void cloneHandler({
			storageData,
			apiUrlCreator,
			skipCheck: true,
			isBare: getExecutingEnvironment() === "next", // todo: добавить настройку при клонировании
			onError: () => {
				refreshPage();
				closeForm();
			},
			onStart: () => {
				refreshPage();
				closeForm();
			},
		});
	};

	const { title, buttonText } = useMemo(() => {
		const modeConfigs = {
			import: {
				title: `${t("catalog.import")} ${t("catalog.name")}`,
				buttonText: t("catalog.import"),
			},
			clone: {
				title: `${t("catalog.clone")} ${t("existing")} ${t("catalog.name")}`,
				buttonText: t("catalog.clone"),
			},
		};

		return modeConfigs[mode];
	}, [LanguageService.currentUi()]);

	const loadUnsupportedElements = async () => {
		if (storageData.source.sourceType === SourceType.yandexDisk) {
			startClone();
			return;
		}

		setStage(CloneStage.LoadUnsupportedElements);
		const res = await FetchService.fetch<UnsupportedElements[]>(
			apiUrlCreator.getUnsupportedElementsUrl(storageData.name, storageData.source.sourceType),
			JSON.stringify(storageData),
		);
		if (!res.ok) {
			closeForm();
			return;
		}
		const elements = await res.json();
		if (!elements?.length) {
			startClone();
			return;
		}
		setUnsupportedElements(elements);
		setStage(CloneStage.AskToImport);
	};

	return (
		<>
			<ModalLayout
				isOpen={isOpen}
				onOpen={() => setIsOpen(true)}
				onClose={closeForm}
				onCmdEnter={startClone}
				trigger={<div>{trigger}</div>}
			>
				<OnNetworkApiErrorService.Provider callback={() => closeForm()}>
					<ModalLayoutLight>
						{stage === CloneStage.AskForStorage && (
							<SelectStorageForm
								onSetStorage={setStorageData}
								disabled={disable}
								mode={mode}
								title={title}
								buttonText={buttonText}
								startClone={startClone}
								loadUnsupportedElements={loadUnsupportedElements}
							/>
						)}

						{stage === CloneStage.LoadUnsupportedElements && (
							<LoadingLayout title={t("checking") + "..."}>
								<SpinnerLoader height={100} width={100} fullScreen />
							</LoadingLayout>
						)}

						{stage === CloneStage.AskToImport && (
							<UnsupportedElementsModal
								startClone={startClone}
								onCancelClick={() => setStage(CloneStage.AskForStorage)}
								unsupportedNodes={unsupportedElements}
								sourceType={storageData.source.sourceType}
							/>
						)}
					</ModalLayoutLight>
				</OnNetworkApiErrorService.Provider>
			</ModalLayout>
		</>
	);
};

export default Clone;
