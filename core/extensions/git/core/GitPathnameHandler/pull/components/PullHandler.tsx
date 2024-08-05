import ModalLayout from "@components/Layouts/Modal";
import ModalLayoutLight from "@components/Layouts/ModalLayoutLight";
import FetchService from "@core-ui/ApiServices/FetchService";
import ApiUrlCreatorService from "@core-ui/ContextServices/ApiUrlCreator";
import SyncIconService from "@core-ui/ContextServices/SyncIconService";
import ArticleViewService from "@core-ui/ContextServices/views/articleView/ArticleViewService";
import InfoModalForm from "@ext/errorHandlers/client/components/ErrorForm";
import SyncService from "@ext/git/actions/Sync/logic/SyncService";
import t from "@ext/localization/locale/translate";
import useIsReview from "@ext/storage/logic/utils/useIsReview";
import { useEffect, useRef, useState } from "react";

const PullHandler = () => {
	const apiUrlCreator = ApiUrlCreatorService.value;
	const isReview = useIsReview();
	const [isOpen, setIsOpen] = useState(false);
	const hasSynced = useRef(false);

	const fetchCatalog = async () => {
		const exit = () => {
			SyncIconService.stop();
			ArticleViewService.setDefaultView();
		};

		SyncIconService.start();
		let res = await FetchService.fetch<boolean>(apiUrlCreator.getStorageHaveToPull());
		if (!res.ok) return exit();

		const haveToPull = await res.json();
		if (!haveToPull) return exit();

		res = await FetchService.fetch<boolean>(apiUrlCreator.getStorageCanPull());
		if (!res.ok) return exit();

		const canPull = await res.json();
		if (!canPull) {
			setIsOpen(true);
			return exit();
		}

		await SyncService.sync(apiUrlCreator, isReview);
		exit();
	};

	useEffect(() => {
		fetchCatalog();
	}, []);

	const onSyncClick = async () => {
		hasSynced.current = true;
		setIsOpen(false);
		await SyncService.sync(apiUrlCreator, isReview);
		ArticleViewService.setDefaultView();
	};

	return (
		<ModalLayout
			isOpen={isOpen}
			onOpen={() => {
				setIsOpen(true);
			}}
			onClose={() => {
				setIsOpen(false);
				if (!hasSynced.current) ArticleViewService.setDefaultView();
			}}
			onCmdEnter={onSyncClick}
		>
			<ModalLayoutLight>
				<InfoModalForm
					onCancelClick={() => setIsOpen(false)}
					title={t("sync-catalog")}
					actionButton={{
						text: t("sync"),
						onClick: onSyncClick,
					}}
					isWarning={true}
				>
					<span>{t("sync-catalog-desc")}</span>
				</InfoModalForm>
			</ModalLayoutLight>
		</ModalLayout>
	);
};

export default PullHandler;
