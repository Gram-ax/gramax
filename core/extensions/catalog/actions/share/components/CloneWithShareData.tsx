import FormStyle from "@components/Form/FormStyle";
import PageDataContextService from "@core-ui/ContextServices/PageDataContext";
import convertShareLinkDataToStorageData from "@ext/catalog/actions/share/logic/convertShareLinkDataToStorageData";
import ShareData from "@ext/catalog/actions/share/model/ShareData";
import GitShareData from "@ext/git/core/model/GitShareData";
import useLocalize from "@ext/localization/useLocalize";
import CreateSourceData from "@ext/storage/logic/SourceDataProvider/components/CreateSourceData";
import SourceData from "@ext/storage/logic/SourceDataProvider/model/SourceData";
import SourceType from "@ext/storage/logic/SourceDataProvider/model/SourceType";
import getPartGitSourceDataByStorageName from "@ext/storage/logic/utils/getPartSourceDataByStorageName";
import getSourceDataByStorageName from "@ext/storage/logic/utils/getSourceDataByStorageName";
import getStorageNameByData from "@ext/storage/logic/utils/getStorageNameByData";
import { useEffect, useState } from "react";
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
	onCreateSourceDataClose?: VoidFunction;
}) => {
	const [sourceData, setSourceData] = useState<SourceData>(null);
	const [hasStorageInitialized, setHasStorageInitialized] = useState(false);
	const [partSourceData, setPartSourceData] = useState<Partial<SourceData>>(null);
	const loadingText = useLocalize("loading2");

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
		} else {
			setPartSourceData(getPartSourceData());
			setHasStorageInitialized(false);
		}
	}, [shareData]);

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
		partSourceData && (
			<CreateSourceData
				defaultSourceData={partSourceData}
				defaultSourceType={shareData.sourceType}
				onCreate={(data) => {
					setSourceData(data);
					setHasStorageInitialized(true);
				}}
				onClose={onCreateSourceDataClose}
			/>
		)
	);
};

export default CloneWithShareData;
