import ModalLoading from "@components/ModalLoading";
import EditEnterpriseConfig from "@ext/enterprise/components/EditEnterpriseConfig";
import MergeModal from "@ext/git/actions/Branch/components/MergeModal";
import MergeRequestModal from "@ext/git/actions/Branch/components/MergeRequestModal";
import MergeConflictConfirm from "@ext/git/actions/MergeConflictHandler/components/MergeConflictConfirm";
import MergeResolver from "@ext/git/actions/MergeConflictHandler/components/MergeResolver";
import PublishModal from "@ext/git/actions/Publish/components/PublishModal";
import CheckoutHandler from "@ext/git/core/GitPathnameHandler/checkout/components/CheckoutHandler";
import CloneHandler from "@ext/git/core/GitPathnameHandler/clone/components/CloneHandler";
import PullHandler from "@ext/git/core/GitPathnameHandler/pull/components/PullHandler";
import ActionWarning from "@ext/localization/actions/ActionWarning";
import DiagramsEditor from "@ext/markdown/elements/diagrams/edit/components/DiagramsEditor";
import SnippetAlreadyUseWarn from "@ext/markdown/elements/snippet/edit/components/SnippetAlreadyUseWarn";
import SnippetEditor from "@ext/markdown/elements/snippet/edit/components/SnippetEditor";
import CreateSourceData from "@ext/storage/logic/SourceDataProvider/components/CreateSourceData";
import { ReactNode } from "react";
import ReviewTicketHandler from "../../../../extensions/catalog/actions/review/components/ReviewTicketHandler";
import ShareTicketHandler from "../../../../extensions/catalog/actions/share/components/ShareTicketHandler";
import ModalToOpen from "../model/ModalsToOpen";
import HTMLEditor from "@ext/markdown/elements/html/edit/components/HTMLEditButton";
import MergeRequestConfirm from "@ext/git/core/GitMergeRequest/components/MergeRequestConfirm";

const getModalComponentToRender: {
	[type in ModalToOpen]: (args: { [name: string]: any }) => ReactNode;
} = {
	[ModalToOpen.MergeConfirm]: MergeConflictConfirm,
	[ModalToOpen.MergeResolver]: MergeResolver,

	[ModalToOpen.Publish]: PublishModal,

	[ModalToOpen.ShareTicketHandler]: ShareTicketHandler,
	[ModalToOpen.ReviewTicketHandler]: ReviewTicketHandler,

	[ModalToOpen.CheckoutHandler]: CheckoutHandler,
	[ModalToOpen.PullHandler]: PullHandler,
	[ModalToOpen.CloneHandler]: CloneHandler,

	[ModalToOpen.SnippetEditor]: SnippetEditor,
	[ModalToOpen.SnippetAlreadyUseWarn]: SnippetAlreadyUseWarn,

	[ModalToOpen.Loading]: ModalLoading,

	[ModalToOpen.MultilangActionConfirm]: ActionWarning,

	[ModalToOpen.DiagramEditor]: DiagramsEditor,
	[ModalToOpen.HTMLEditor]: HTMLEditor,

	[ModalToOpen.Merge]: MergeModal,
	[ModalToOpen.MergeRequest]: MergeRequestModal,
	[ModalToOpen.MergeRequestConfirm]: MergeRequestConfirm,

	[ModalToOpen.CreateSourceData]: CreateSourceData,

	[ModalToOpen.EditEnterpriseConfig]: EditEnterpriseConfig,
};

export default getModalComponentToRender;
