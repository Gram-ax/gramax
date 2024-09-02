// import ArticleUpdaterService from "@components/Article/ArticleUpdater/ArticleUpdaterService";
// import FetchService from "@core-ui/ApiServices/FetchService";
// import ApiUrlCreatorService from "@core-ui/ContextServices/ApiUrlCreator";
// import ModalToOpenService from "@core-ui/ContextServices/ModalToOpenService/ModalToOpenService";
// import ModalToOpen from "@core-ui/ContextServices/ModalToOpenService/model/ModalsToOpen";
// import ErrorConfirmService from "@ext/errorHandlers/client/ErrorConfirmService";
// import BranchUpdaterService from "@ext/git/actions/Branch/BranchUpdaterService/logic/BranchUpdaterService";
// import Publish from "@ext/git/actions/Publish/components/Publish";
// import { ComponentProps, useEffect, useRef } from "react";
import t from "@ext/localization/locale/translate";
import { ComponentProps } from "react";
import InfoModalForm from "../../../../../errorHandlers/client/components/ErrorForm";
import GetErrorComponent from "../../../../../errorHandlers/logic/GetErrorComponent";

const CheckoutConflictErrorComponent = ({ onCancelClick }: ComponentProps<typeof GetErrorComponent>) => {
	return (
		<InfoModalForm
			onCancelClick={onCancelClick}
			title={t("git.checkout.error.conflict")}
			closeButton={{ text: t("ok") }}
		>
			<span>{t("git.checkout.conflict")}</span>
		</InfoModalForm>
	);

	// const apiUrlCreator = ApiUrlCreatorService.value;
	// const openedPublishModal = useRef(false);

	// const onPublishClose = async (hasPublished: boolean) => {
	// 	if (hasPublished) {
	// 		let res = await FetchService.fetch(apiUrlCreator.getVersionControlBranchToCheckoutUrl());
	// 		if (!res.ok) return;
	// 		const branchName = await res.text();
	// 		if (!branchName) return;
	// 		res = await FetchService.fetch(apiUrlCreator.getVersionControlCheckoutBranchUrl(branchName));
	// 		if (!res.ok) return;
	// 		await BranchUpdaterService.updateBranch(apiUrlCreator);
	// 		await ArticleUpdaterService.update(apiUrlCreator);
	// 	} else {
	// 		ModalToOpenService.resetValue();
	// 		await FetchService.fetch(apiUrlCreator.getVersionControlAbortCheckoutStateUrl());
	// 	}
	// };

	// useEffect(() => {
	// 	ErrorConfirmService.onModalClose = async () => {
	// 		if (openedPublishModal.current) return;
	// 		await FetchService.fetch(apiUrlCreator.getVersionControlAbortCheckoutStateUrl());
	// 	};
	// }, [apiUrlCreator]);

	// return (
	// 	<InfoModalForm
	// 		isWarning
	// 		icon={{ code: "alert-circle", color: "var(--color-admonition-note-br-h)" }}
	// 		onCancelClick={onCancelClick}
	// 		title={t("git.checkout.error.conflict")}
	// 		closeButton={{ text: t("cancel") }}
	// 		actionButton={{
	// 			text: t("publish-changes"),
	// 			onClick: () => {
	// 				openedPublishModal.current = true;
	// 				ModalToOpenService.setValue<ComponentProps<typeof Publish>>(ModalToOpen.Publish, {
	// 					onClose: async (hasPublished) => {
	// 						ModalToOpenService.setValue(ModalToOpen.Loading);
	// 						await onPublishClose(hasPublished);
	// 						ModalToOpenService.resetValue();
	// 					},
	// 				});
	// 				onCancelClick();
	// 			},
	// 		}}
	// 	>
	// 		<span>{t("git.checkout.conflict")}</span>
	// 	</InfoModalForm>
	// );
};

export default CheckoutConflictErrorComponent;
