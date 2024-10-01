import ModalLayout from "@components/Layouts/Modal";
import ModalLayoutLight from "@components/Layouts/ModalLayoutLight";
import CloneWithShareData from "@ext/catalog/actions/share/components/CloneWithShareData";
import { useEffect, useState } from "react";
import FetchService from "../../../../../ui-logic/ApiServices/FetchService";
import MimeTypes from "../../../../../ui-logic/ApiServices/Types/MimeTypes";
import ApiUrlCreatorService from "../../../../../ui-logic/ContextServices/ApiUrlCreator";
import ShareData from "../model/ShareData";

const ShareTicketHandler = ({ ticket }: { ticket: string }) => {
	const [shareLinkData, setShareLinkData] = useState<ShareData>(null);
	const [isOpen, setIsOpen] = useState(true);
	const getShareLinkDataUrl = ApiUrlCreatorService.value.getShareLinkDataUrl();

	const close = () => setIsOpen(false);

	const getShareLinkData = async () => {
		const res = await FetchService.fetch<ShareData>(getShareLinkDataUrl, ticket, MimeTypes.text);
		if (!res.ok) {
			close();
			return;
		}
		setShareLinkData(await res.json());
	};

	useEffect(() => {
		getShareLinkData();
	}, []);

	return (
		<ModalLayout isOpen={isOpen} onClose={close}>
			<ModalLayoutLight>
				<CloneWithShareData
					shareData={shareLinkData}
					onCloneError={close}
					onCreateSourceDataClose={close}
				/>
			</ModalLayoutLight>
		</ModalLayout>
	);
};

export default ShareTicketHandler;
