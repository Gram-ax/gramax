import ModalLayout from "@components/Layouts/Modal";
import ModalLayoutLight from "@components/Layouts/ModalLayoutLight";
import FetchService from "@core-ui/ApiServices/FetchService";
import ApiUrlCreatorService from "@core-ui/ContextServices/ApiUrlCreator";
import InfoModalForm from "@ext/errorHandlers/client/components/ErrorForm";
import SyncService from "@ext/git/actions/Sync/logic/SyncService";
import CurrentLink from "@ext/git/core/GitPathnameHandler/components/CurrentLink";
import useLocalize from "@ext/localization/useLocalize";
import useIsReview from "@ext/storage/logic/utils/useIsReview";
import { useEffect, useState } from "react";

const PullHandler = ({ href, isStorageInitialized }: { href: string; isStorageInitialized: boolean }) => {
	const apiUrlCreator = ApiUrlCreatorService.value;
	const isReview = useIsReview();
	const [isOpen, setIsOpen] = useState(false);

	const fetchCatalog = async () => {
		const res = await FetchService.fetch<boolean>(apiUrlCreator.getStorageHaveToPull());
		if (!res.ok) return;
		const haveToPull = await res.json();
		setIsOpen(haveToPull);
	};

	useEffect(() => {
		if (!isStorageInitialized) return;
		fetchCatalog();
	}, []);

	return (
		<ModalLayout isOpen={isOpen}>
			<ModalLayoutLight>
				<InfoModalForm
					onCancelClick={() => setIsOpen(false)}
					title={useLocalize("goToLink")}
					actionButton={{
						text: useLocalize("sync"),
						onClick: () => {
							SyncService.sync(apiUrlCreator, isReview);
							setIsOpen(false);
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
