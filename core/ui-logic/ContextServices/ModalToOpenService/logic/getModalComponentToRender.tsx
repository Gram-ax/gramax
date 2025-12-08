import ExportPdf from "@components/Actions/Modal/ExportPdf";
import ActionConfirm from "@components/Atoms/ActionConfirm";
import MediaPreview from "@components/Atoms/Image/modalImage/MediaPreview";
import DocRootMissingModal from "@components/Layouts/CatalogLayout/DocRootMissingModal";
import ModalLoading from "@components/ModalLoading";
import UnsavedChangesModal from "@components/UnsavedChangesModal";
import EditMarkdown from "@ext/article/actions/EditMarkdown";
import DuplicateArticleDialog from "@ext/article/actions/move/DuplicateArticleDialog";
import BugsnagModal from "@ext/bugsnag/components/BugsnagModal";
import DuplicateCatalogDialog from "@ext/catalog/actions/move/components/DuplicateCatalogDialog";
import CatalogPropsEditor from "@ext/catalog/actions/propsEditor/components/CatalogPropsEditor";
import ShareModal from "@ext/catalog/actions/share/components/ShareModal";
import { Admin } from "@ext/enterprise/components/admin/Admin";
import EditEnterpriseConfig from "@ext/enterprise/components/EditEnterpriseConfig";
import { RepositoryPermission } from "@ext/enterprise/components/RepositoryPermission";
import SignOutEnterprise from "@ext/enterprise/components/SignOutEnterprise";
import MergeModal from "@ext/git/actions/Branch/components/MergeModal";
import CreateMergeRequestModal from "@ext/git/actions/Branch/components/MergeRequest/CreateMergeRequest";
import CloneModal from "@ext/git/actions/Clone/components/CloneModal";
import HistoryModal from "@ext/git/actions/History/component/History";
import MergeConflictConfirm from "@ext/git/actions/MergeConflictHandler/components/MergeConflictConfirm";
import MergeResolver from "@ext/git/actions/MergeConflictHandler/components/MergeResolver";
import MergeRequestConfirm from "@ext/git/core/GitMergeRequest/components/MergeRequestConfirm";
import CheckoutHandler from "@ext/git/core/GitPathnameHandler/checkout/components/CheckoutHandler";
import CloneHandler from "@ext/git/core/GitPathnameHandler/clone/components/CloneHandler";
import PullHandler from "@ext/git/core/GitPathnameHandler/pull/components/PullHandler";
import Healthcheck from "@ext/healthcheck/components/Healthcheck";
import CommonUnsupportedElementsModal from "@ext/import/components/CommonUnsupportedElementsModal";
import ImportModal from "@ext/import/components/ImportModal";
import PropsEditor from "@ext/item/actions/propsEditor/components/PropsEditor";
import OtherLanguagesPresentWarning from "@ext/localization/actions/OtherLanguagesPresentWarning";
import DiagramsEditor from "@ext/markdown/elements/diagrams/edit/components/DiagramsEditor";
import FilePreviewModal from "@ext/markdown/elements/file/edit/components/Preview/FilePreviewModal";
import HTMLEditor from "@ext/markdown/elements/html/edit/components/HTMLEditButton";
import SnippetAlreadyUseWarn from "@ext/markdown/elements/snippet/edit/components/SnippetAlreadyUseWarn";
import PropertyEditor from "@ext/properties/components/Modals/PropertyEditor";
import GetSharedTicket from "@ext/security/logic/TicketManager/components/GetSharedTicket";
import CloudModal from "@ext/static/components/CloudModal";
import CreateStorageModal from "@ext/storage/components/CreateStorageModal";
import TemplateContentWarning from "@ext/templates/components/TemplateContentWarning";
import CreateWorkspaceForm from "@ext/workspace/components/CreateWorkspaceForm";
import EditWorkspaceForm from "@ext/workspace/components/EditWorkspaceForm";
import { ReactNode } from "react";
import ReviewTicketHandler from "../../../../extensions/catalog/actions/review/components/ReviewTicketHandler";
import ShareTicketHandler from "../../../../extensions/catalog/actions/share/components/ShareTicketHandler";
import ModalToOpen from "../model/ModalsToOpen";
import { AlertComment } from "@ext/markdown/elements/comment/edit/components/AlertComment";

const getModalComponentToRender: {
	[type in ModalToOpen]: (args: { [name: string]: any }) => ReactNode;
} = {
	[ModalToOpen.DuplicateCatalogDialog]: DuplicateCatalogDialog,
	[ModalToOpen.DuplicateArticleDialog]: DuplicateArticleDialog,
	[ModalToOpen.MergeConfirm]: MergeConflictConfirm,
	[ModalToOpen.MergeResolver]: MergeResolver,

	[ModalToOpen.ShareTicketHandler]: ShareTicketHandler,
	[ModalToOpen.ReviewTicketHandler]: ReviewTicketHandler,

	[ModalToOpen.CheckoutHandler]: CheckoutHandler,
	[ModalToOpen.PullHandler]: PullHandler,
	[ModalToOpen.CloneHandler]: CloneHandler,
	[ModalToOpen.Clone]: CloneModal,

	[ModalToOpen.ImportModal]: ImportModal,

	[ModalToOpen.SnippetAlreadyUseWarn]: SnippetAlreadyUseWarn,

	[ModalToOpen.Loading]: ModalLoading,

	[ModalToOpen.MultilangActionConfirm]: OtherLanguagesPresentWarning,

	[ModalToOpen.DiagramEditor]: DiagramsEditor,
	[ModalToOpen.HTMLEditor]: HTMLEditor,

	[ModalToOpen.Merge]: MergeModal,
	[ModalToOpen.CreateMergeRequest]: CreateMergeRequestModal,
	[ModalToOpen.MergeRequestConfirm]: MergeRequestConfirm,

	[ModalToOpen.CreateStorage]: CreateStorageModal,

	[ModalToOpen.EditEnterpriseConfig]: EditEnterpriseConfig,

	[ModalToOpen.TemplateContentWarning]: TemplateContentWarning,
	[ModalToOpen.PropertySettings]: PropertyEditor,

	[ModalToOpen.DocRootMissingModal]: DocRootMissingModal,

	[ModalToOpen.CloudModal]: CloudModal,

	[ModalToOpen.ItemPropsEditor]: PropsEditor,

	[ModalToOpen.CreateWorkspaceForm]: CreateWorkspaceForm,
	[ModalToOpen.EditWorkspaceForm]: EditWorkspaceForm,

	[ModalToOpen.MediaPreview]: MediaPreview,
	[ModalToOpen.FilePreview]: FilePreviewModal,

	[ModalToOpen.EnterpriseLogout]: SignOutEnterprise,
	[ModalToOpen.MarkdownEditor]: EditMarkdown,
	[ModalToOpen.BugsnagModal]: BugsnagModal,
	[ModalToOpen.History]: HistoryModal,
	[ModalToOpen.UnsupportedElements]: CommonUnsupportedElementsModal,
	[ModalToOpen.Share]: ShareModal,

	[ModalToOpen.CatalogPropsEditor]: CatalogPropsEditor,
	[ModalToOpen.GetSharedTicket]: GetSharedTicket,
	[ModalToOpen.Healthcheck]: Healthcheck,

	[ModalToOpen.ActionConfirm]: ActionConfirm,

	[ModalToOpen.ExportPdf]: ExportPdf,

	[ModalToOpen.GesAdmin]: Admin,

	[ModalToOpen.UnsavedChangesModal]: UnsavedChangesModal,
	[ModalToOpen.UnsavedCommentModal]: AlertComment,

	[ModalToOpen.RepositoryPermission]: RepositoryPermission,
};

export default getModalComponentToRender;
