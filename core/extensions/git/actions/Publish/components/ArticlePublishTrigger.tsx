import StatusBarElement from "@components/Layouts/StatusBar/StatusBarElement";
import ModalToOpenService from "@core-ui/ContextServices/ModalToOpenService/ModalToOpenService";
import ModalToOpen from "@core-ui/ContextServices/ModalToOpenService/model/ModalsToOpen";
import Publish from "@ext/git/actions/Publish/components/Publish";
import t from "@ext/localization/locale/translate";
import { ComponentProps } from "react";

const ArticlePublishTrigger = ({ changesCount }: { changesCount?: number }) => {
	return (
		<StatusBarElement
			onClick={() => {
				ModalToOpenService.setValue<ComponentProps<typeof Publish>>(ModalToOpen.Publish, {
					onClose: () => ModalToOpenService.resetValue(),
				});
			}}
			iconCode="cloud"
			iconStyle={{ fontSize: "15px" }}
			tooltipText={t("publish-changes")}
		>
			{changesCount ? <span>{changesCount}</span> : null}
		</StatusBarElement>
	);
};

export default ArticlePublishTrigger;
