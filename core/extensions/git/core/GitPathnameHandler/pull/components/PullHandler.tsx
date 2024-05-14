import SpinnerLoader from "@components/Atoms/SpinnerLoader";
import ModalLayout from "@components/Layouts/Modal";
import ModalLayoutLight from "@components/Layouts/ModalLayoutLight";
import FetchService from "@core-ui/ApiServices/FetchService";
import ApiUrlCreatorService from "@core-ui/ContextServices/ApiUrlCreator";
import SyncIconService from "@core-ui/ContextServices/SyncIconService";
import ArticleViewService from "@core-ui/ContextServices/views/articleView/ArticleViewService";
import { ClientArticleProps } from "@core/SitePresenter/SitePresenter";
import styled from "@emotion/styled";
import InfoModalForm from "@ext/errorHandlers/client/components/ErrorForm";
import SyncService from "@ext/git/actions/Sync/logic/SyncService";
import CurrentLink from "@ext/git/core/GitPathnameHandler/components/CurrentLink";
import useLocalize from "@ext/localization/useLocalize";
import useIsReview from "@ext/storage/logic/utils/useIsReview";
import { useEffect, useState } from "react";

const StyledDiv = styled.div`
	height: 100%;
	display: flex;
	align-items: center;
	justify-content: center;
`;

const PullHandler = ({
	href,
	isStorageInitialized,
	articleProps,
}: {
	href: string;
	isStorageInitialized: boolean;
	articleProps: ClientArticleProps;
}) => {
	const apiUrlCreator = ApiUrlCreatorService.value;
	const isReview = useIsReview();
	const [isOpen, setIsOpen] = useState(false);
	const [hasSynced, setHasSynced] = useState(false);
	const isArticleFound = articleProps.errorCode !== 404;

	const setLoading = () => {
		if (isArticleFound) return;
		ArticleViewService.setView(() => (
			<StyledDiv>
				<SpinnerLoader />
			</StyledDiv>
		));
	};

	const setDefaultArticle = () => {
		if (isArticleFound) return;
		ArticleViewService.setDefaultView();
	};

	const fetchCatalog = async () => {
		setLoading();
		SyncIconService.start();
		const res = await FetchService.fetch<boolean>(apiUrlCreator.getStorageHaveToPull());
		SyncIconService.stop();
		if (!res.ok) return;
		const haveToPull = await res.json();
		if (!haveToPull) setDefaultArticle();
		setIsOpen(haveToPull);
	};

	useEffect(() => {
		if (!isStorageInitialized) return;
		fetchCatalog();
	}, []);

	return (
		<ModalLayout
			isOpen={isOpen}
			onOpen={() => {
				setIsOpen(true);
			}}
			onClose={() => {
				setIsOpen(false);
				if (!hasSynced) setDefaultArticle();
			}}
		>
			<ModalLayoutLight>
				<InfoModalForm
					onCancelClick={() => setIsOpen(false)}
					title={useLocalize("goToLink")}
					actionButton={{
						text: useLocalize("sync"),
						onClick: async () => {
							setHasSynced(true);
							setIsOpen(false);
							await SyncService.sync(apiUrlCreator, isReview);
							setDefaultArticle();
						},
					}}
					isError={false}
				>
					<span>
						{useLocalize("link")} <CurrentLink href={href} />{" "}
						{useLocalize("takesToMoreCurrentVersion").toLowerCase()}. {useLocalize("sync")}{" "}
						{useLocalize("catalog2")}?
					</span>
				</InfoModalForm>
			</ModalLayoutLight>
		</ModalLayout>
	);
};

export default PullHandler;
