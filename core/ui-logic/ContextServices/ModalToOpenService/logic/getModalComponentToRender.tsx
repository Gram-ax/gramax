import ModalLoading from "@components/ModalLoading";
import EditEnterpriseConfig from "@ext/enterprise/components/EditEnterpriseConfig";
import MergeModal from "@ext/git/actions/Branch/components/MergeModal";
import CreateMergeRequestModal from "@ext/git/actions/Branch/components/MergeRequest/CreateMergeRequest";
import MergeConflictConfirm from "@ext/git/actions/MergeConflictHandler/components/MergeConflictConfirm";
import MergeResolver from "@ext/git/actions/MergeConflictHandler/components/MergeResolver";
import MergeRequestConfirm from "@ext/git/core/GitMergeRequest/components/MergeRequestConfirm";
import CheckoutHandler from "@ext/git/core/GitPathnameHandler/checkout/components/CheckoutHandler";
import CloneHandler from "@ext/git/core/GitPathnameHandler/clone/components/CloneHandler";
import PullHandler from "@ext/git/core/GitPathnameHandler/pull/components/PullHandler";
import OtherLanguagesPresentWarning from "@ext/localization/actions/OtherLanguagesPresentWarning";
import DiagramsEditor from "@ext/markdown/elements/diagrams/edit/components/DiagramsEditor";
import HTMLEditor from "@ext/markdown/elements/html/edit/components/HTMLEditButton";
import SnippetAlreadyUseWarn from "@ext/markdown/elements/snippet/edit/components/SnippetAlreadyUseWarn";
import CreateSourceData from "@ext/storage/logic/SourceDataProvider/components/CreateSourceData";
import TemplateContentWarning from "@ext/templates/components/TemplateContentWarning";
import { ReactNode } from "react";
import ReviewTicketHandler from "../../../../extensions/catalog/actions/review/components/ReviewTicketHandler";
import ShareTicketHandler from "../../../../extensions/catalog/actions/share/components/ShareTicketHandler";
import ModalToOpen from "../model/ModalsToOpen";
import DocRootMissingModal from "@components/Layouts/CatalogLayout/DocRootMissingModal";
import PropertyEditor from "@ext/properties/components/Modals/PropertyEditor";

const getModalComponentToRender: {
	[type in ModalToOpen]: (args: { [name: string]: any }) => ReactNode;
} = {
	[ModalToOpen.MergeConfirm]: MergeConflictConfirm,
	[ModalToOpen.MergeResolver]: MergeResolver,


	[ModalToOpen.ShareTicketHandler]: ShareTicketHandler,
	[ModalToOpen.ReviewTicketHandler]: ReviewTicketHandler,

	[ModalToOpen.CheckoutHandler]: CheckoutHandler,
	[ModalToOpen.PullHandler]: PullHandler,
	[ModalToOpen.CloneHandler]: CloneHandler,

	[ModalToOpen.SnippetAlreadyUseWarn]: SnippetAlreadyUseWarn,

	[ModalToOpen.Loading]: ModalLoading,

	[ModalToOpen.MultilangActionConfirm]: OtherLanguagesPresentWarning,

	[ModalToOpen.DiagramEditor]: DiagramsEditor,
	[ModalToOpen.HTMLEditor]: HTMLEditor,

	[ModalToOpen.Merge]: MergeModal,
	[ModalToOpen.CreateMergeRequest]: CreateMergeRequestModal,
	[ModalToOpen.MergeRequestConfirm]: MergeRequestConfirm,

	[ModalToOpen.CreateSourceData]: CreateSourceData,

	[ModalToOpen.EditEnterpriseConfig]: EditEnterpriseConfig,

	[ModalToOpen.TemplateContentWarning]: TemplateContentWarning,
	[ModalToOpen.PropertySettings]: PropertyEditor,

	[ModalToOpen.DocRootMissingModal]: DocRootMissingModal,
};

export default getModalComponentToRender;
