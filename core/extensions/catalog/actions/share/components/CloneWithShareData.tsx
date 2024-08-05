import FormStyle from "@components/Form/FormStyle";
import SmallFence from "@components/Labels/SmallFence";
import PageDataContextService from "@core-ui/ContextServices/PageDataContext";
import convertShareLinkDataToStorageData from "@ext/catalog/actions/share/logic/convertShareLinkDataToStorageData";
import ShareData from "@ext/catalog/actions/share/model/ShareData";
import InfoModalForm from "@ext/errorHandlers/client/components/ErrorForm";
import GitShareData from "@ext/git/core/model/GitShareData";
import t from "@ext/localization/locale/translate";
import CreateSourceData from "@ext/storage/logic/SourceDataProvider/components/CreateSourceData";
import SourceData from "@ext/storage/logic/SourceDataProvider/model/SourceData";
import SourceType from "@ext/storage/logic/SourceDataProvider/model/SourceType";
import getPartGitSourceDataByStorageName from "@ext/storage/logic/utils/getPartSourceDataByStorageName";
import getSourceDataByStorageName from "@ext/storage/logic/utils/getSourceDataByStorageName";
import getStorageNameByData from "@ext/storage/logic/utils/getStorageNameByData";
import { useEffect, useRef, useState } from "react";
import CloneProgressbar from "../../../../git/actions/Clone/components/CloneProgressbar";

const CloneWithShareData = ({
	shareData,
	onCloneError,
	onCloneFinish,
	onCreateSourceDataClose,
}: {
	shareData: ShareData;
	onCloneError?: VoidFunction;
	onCloneFinish?: VoidFunction;
	onCreateSourceDataClose?: (success: boolean) => void;
}) => {
	const [sourceData, setSourceData] = useState<SourceData>(null);
	const [hasStorageInitialized, setHasStorageInitialized] = useState(false);
	const hasStorageInitializedRef = useRef(false);
	const [partSourceData, setPartSourceData] = useState<Partial<SourceData>>(null);
	const [createSourceDataStep, setCreateSourceDataStep] = useState<"warning" | "create">("warning");
	const loadingText = t("loading2");

	const pageProps = PageDataContextService.value;

	const getStorageData = () => convertShareLinkDataToStorageData(sourceData, shareData);

	const getBranch = () => {
		if (shareData.sourceType === SourceType.gitHub || shareData.sourceType === SourceType.gitLab) {
			return (shareData as GitShareData).branch;
		}
	};

	const getPartSourceData = () => {
		if (shareData.sourceType === SourceType.gitHub || shareData.sourceType === SourceType.gitLab) {
			return getPartGitSourceDataByStorageName((shareData as GitShareData).domain).data;
		}
		return {};
	};

	useEffect(() => {
		if (!shareData) return;
		const shareLinkStorageName = getStorageNameByData(shareData);
		const res = getSourceDataByStorageName(shareLinkStorageName, pageProps);
		if (res) {
			setSourceData(res);
			setHasStorageInitialized(true);
			hasStorageInitializedRef.current = true;
		} else {
			setPartSourceData(getPartSourceData());
			setHasStorageInitialized(false);
			hasStorageInitializedRef.current = false;
		}
	}, [shareData]);

	const domain = (
		<div style={{ display: "inline-flex" }}>
			<SmallFence overflow="hidden" fixWidth value={(shareData as GitShareData).domain} />
		</div>
	);

	const createSourceDataWarning = (
		<InfoModalForm
			isWarning={true}
			title={t("clone-fail")}
			onCancelClick={() => onCreateSourceDataClose(false)}
			actionButton={{
				onClick: () => setCreateSourceDataStep("create"),
				text: t("add-storage"),
			}}
		>
			<span>
				{t("no-access-to-storage")} {domain}. {t("add-to-continue-downloading")}
			</span>
		</InfoModalForm>
	);

	const createSourceData = (
		<CreateSourceData
			defaultSourceData={partSourceData}
			defaultSourceType={shareData.sourceType}
			onCreate={(data) => {
				setSourceData(data);
				setHasStorageInitialized(true);
				hasStorageInitializedRef.current = true;
			}}
			onClose={() => onCreateSourceDataClose(!!hasStorageInitializedRef.current)}
		/>
	);

	const getCreateSourceDataStep = createSourceDataStep === "warning" ? createSourceDataWarning : createSourceData;

	useEffect(() => {
		if (createSourceDataStep !== "warning") return;
		const keydownHandler = (e: KeyboardEvent) => {
			if (!(e.code === "Enter" && (e.ctrlKey || e.metaKey))) return;
			setCreateSourceDataStep("create");
		};
		window.addEventListener("keydown", keydownHandler);
		return () => window.removeEventListener("keydown", keydownHandler);
	}, [createSourceDataStep]);

	return hasStorageInitialized ? (
		<FormStyle>
			<>
				<legend>{loadingText}</legend>
				<CloneProgressbar
					triggerClone={getStorageData()}
					branch={getBranch()}
					filePath={shareData.filePath}
					storageData={getStorageData()}
					onError={onCloneError}
					onFinish={onCloneFinish}
					recursive={false}
				/>
			</>
		</FormStyle>
	) : (
		partSourceData && getCreateSourceDataStep
	);
};

export default CloneWithShareData;
