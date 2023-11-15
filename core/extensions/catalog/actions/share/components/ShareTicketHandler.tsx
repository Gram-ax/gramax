import FormStyle from "@components/Form/FormStyle";
import ModalLayout from "@components/Layouts/Modal";
import ModalLayoutLight from "@components/Layouts/ModalLayoutLight";
import { useEffect, useState } from "react";
import FetchService from "../../../../../ui-logic/ApiServices/FetchService";
import MimeTypes from "../../../../../ui-logic/ApiServices/Types/MimeTypes";
import ApiUrlCreatorService from "../../../../../ui-logic/ContextServices/ApiUrlCreator";
import PageDataContextService from "../../../../../ui-logic/ContextServices/PageDataContext";
import GitShareLinkData from "../../../../git/core/model/GitShareLinkData";
import useLocalize from "../../../../localization/useLocalize";
import CreateSourceData from "../../../../storage/logic/SourceDataProvider/components/CreateSourceData";
import SourceData from "../../../../storage/logic/SourceDataProvider/model/SourceData";
import SourceType from "../../../../storage/logic/SourceDataProvider/model/SourceType";
import getPartSourceDataByStorageName from "../../../../storage/logic/utils/getPartSourceDataByStorageName";
import getSourceNameByData from "../../../../storage/logic/utils/getSourceNameByData";
import ReviewClone from "../../review/components/ReviewClone";
import convertShareLinkDataToStorageData from "../logic/convertShareLinkDataToStorageData";
import ShareLinkData from "../model/ShareLinkData";

const ShareTicketHandler = ({ ticket }: { ticket: string }) => {
	const [isOpen, setIsOpen] = useState(true);
	const [shareLinkData, setShareLinkData] = useState<ShareLinkData>(null);
	const [hasStorageIniziliate, setHasStorageIniziliate] = useState(false);

	const [sourceData, setSourceData] = useState<SourceData>(null);
	const [partSourceData, setPartSourceData] = useState<{ [key: string]: string }>(null);

	const loadingText = useLocalize("loading2");
	const getShareLinkDataUrl = ApiUrlCreatorService.value.getShareLinkDataUrl();
	const pageProps = PageDataContextService.value;

	const getPartSourceData = () => {
		if (shareLinkData.sourceType === SourceType.gitHub || shareLinkData.sourceType === SourceType.gitLab) {
			return getPartSourceDataByStorageName((shareLinkData as GitShareLinkData).domain).data;
		}
		return {};
	};

	const getStorageData = () => convertShareLinkDataToStorageData(sourceData, shareLinkData);

	const getBranch = () => {
		if (shareLinkData.sourceType === SourceType.gitHub || shareLinkData.sourceType === SourceType.gitLab) {
			return (shareLinkData as GitShareLinkData).branch;
		}
	};

	const getShareLinkData = async () => {
		const res = await FetchService.fetch<ShareLinkData>(getShareLinkDataUrl, ticket, MimeTypes.text);
		if (!res.ok) {
			setIsOpen(false);
			return;
		}
		setShareLinkData(await res.json());
	};

	useEffect(() => {
		getShareLinkData();
	}, []);

	useEffect(() => {
		if (!shareLinkData) return;
		const shareLinkStorageName = getSourceNameByData(shareLinkData);
		if (pageProps.sourceDatas.length === 0) {
			setHasStorageIniziliate(false);
			setPartSourceData(getPartSourceData());
		} else {
			for (const sourceData of pageProps.sourceDatas) {
				const sourceDataStorageName = getSourceNameByData(sourceData);
				if (sourceDataStorageName == shareLinkStorageName) {
					setHasStorageIniziliate(true);
					setSourceData(sourceData);
					return;
				} else {
					setHasStorageIniziliate(false);
					setPartSourceData(getPartSourceData());
				}
			}
		}
	}, [shareLinkData]);

	return (
		<ModalLayout isOpen={isOpen} onClose={() => setIsOpen(false)}>
			{hasStorageIniziliate ? (
				<ModalLayoutLight>
					<FormStyle>
						<>
							<legend>{loadingText}</legend>
							<ReviewClone
								filePath={shareLinkData.filePath}
								storageData={getStorageData()}
								onCloneError={() => setIsOpen(false)}
								branch={getBranch()}
							/>
						</>
					</FormStyle>
				</ModalLayoutLight>
			) : (
				partSourceData && (
					<CreateSourceData
						defaultSourceData={partSourceData}
						defaultSourceType={shareLinkData.sourceType}
						onCreate={(data) => {
							setSourceData(data);
							setHasStorageIniziliate(true);
						}}
						onClose={() => setIsOpen(false)}
					/>
				)
			)}
		</ModalLayout>
	);
};

export default ShareTicketHandler;
