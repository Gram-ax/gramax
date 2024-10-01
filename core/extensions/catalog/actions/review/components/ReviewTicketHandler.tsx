import FormStyle from "@components/Form/FormStyle";
import ModalLayout from "@components/Layouts/Modal";
import ModalLayoutLight from "@components/Layouts/ModalLayoutLight";
import { ReviewLinkData } from "@ext/catalog/actions/review/model/ReviewLinkData";
import t from "@ext/localization/locale/translate";
import { useEffect, useState } from "react";
import FetchService from "../../../../../ui-logic/ApiServices/FetchService";
import MimeTypes from "../../../../../ui-logic/ApiServices/Types/MimeTypes";
import ApiUrlCreatorService from "../../../../../ui-logic/ContextServices/ApiUrlCreator";

const ReviewTicketHandler = ({ ticket }: { ticket: string }) => {
	const apiUrlCreator = ApiUrlCreatorService.value;
	const [isOpen, setIsOpen] = useState(true);
	const [reviewData, setStorageData] = useState<ReviewLinkData>(null);
	const [isSorceDataSetted, setIsSourceDataSetted] = useState(false);

	useEffect(() => {
		getStorageData();
	}, []);

	useEffect(() => {
		if (!reviewData || isSorceDataSetted) return;
		setSourceData();
	}, [reviewData]);

	const getStorageData = async () => {
		const res = await FetchService.fetch<ReviewLinkData>(apiUrlCreator.getReviewStorageDataUrl(), ticket);
		if (!res.ok) {
			setIsOpen(false);
			return;
		}

		setStorageData(await res.json());
	};

	const setSourceData = async () => {
		const res = await FetchService.fetch(
			apiUrlCreator.setSourceData(),
			JSON.stringify(reviewData.source),
			MimeTypes.json,
		);
		if (!res.ok) return;
		setIsSourceDataSetted(true);
	};

	return (
		<ModalLayout isOpen={isOpen}>
			<ModalLayoutLight>
				<FormStyle>
					<>
						<legend>{t("loading2")}</legend>
					</>
				</FormStyle>
			</ModalLayoutLight>
		</ModalLayout>
	);
};

export default ReviewTicketHandler;
