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
import NotificationSettingsModal from "@ext/enterprise/components/NotificationSettingsModal";
import { SignInEnterpriseTauriForm } from "@ext/enterprise/components/SingInOut/SignInEnterpriseTauriForm";
import SignOutEnterprise from "@ext/enterprise/components/SingInOut/SignOutEnterprise";
import { GesCloudInitCatalog } from "@ext/enterprise-cloud/components/Catalog/GesCloudInitCatalog";
import { GesCloudSignInFormModal } from "@ext/enterprise-cloud/components/GesCloudSignInFormModal";
import { InviteMismatchModal } from "@ext/enterprise-cloud/components/InviteMismatchModal";
import { GesCloudOrganizationSettingsModal } from "@ext/enterprise-cloud/components/organizationSettings/OrganizationSettings";
import { GesCloudInviteUserModal } from "@ext/enterprise-cloud/components/organizationSettings/settings/components/UserToolbarInviteBtn";
import GesCloudSignOutModal from "@ext/enterprise-cloud/components/SignInOut/GesCloudSignOutModal";
import MergeModal from "@ext/git/actions/Branch/components/MergeModal";
import CreateMergeRequestModal from "@ext/git/actions/Branch/components/MergeRequest/CreateMergeRequest";
import CloneModal from "@ext/git/actions/Clone/components/CloneModal";
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
import FragmentAlreadyUseWarn from "@ext/markdown/elements/fragment/edit/components/FragmentAlreadyUseWarn";
import HTMLEditor from "@ext/markdown/elements/html/edit/components/HTMLEditButton";
import PropertyEditor from "@ext/properties/components/Modals/PropertyEditor";
import CloudModal from "@ext/static/components/CloudModal";
import CreateStorageModal from "@ext/storage/components/CreateStorageModal";
import TemplateContentWarning from "@ext/templates/components/TemplateContentWarning";
import CreateWorkspaceForm from "@ext/workspace/components/CreateWorkspaceForm";
import EditWorkspaceForm from "@ext/workspace/components/EditWorkspaceForm";
import { AlertConfirm } from "@ui-kit/AlertDialog";
import { lazy, type ReactNode } from "react";
import DefaultModal from "../components/DefaultModal";
import ModalToOpen from "../model/ModalsToOpen";

const getModalComponentToRender: {
	// biome-ignore lint/suspicious/noExplicitAny: it's ok
	[type in ModalToOpen]: (args: { [name: string]: any }) => ReactNode;
} = {
	[ModalToOpen.DuplicateCatalogDialog]: DuplicateCatalogDialog,
	[ModalToOpen.DuplicateArticleDialog]: DuplicateArticleDialog,
	[ModalToOpen.MergeConfirm]: MergeConflictConfirm,
	[ModalToOpen.MergeResolver]: MergeResolver,

	[ModalToOpen.CheckoutHandler]: CheckoutHandler,
	[ModalToOpen.PullHandler]: PullHandler,
	[ModalToOpen.CloneHandler]: CloneHandler,
	[ModalToOpen.Clone]: CloneModal,

	[ModalToOpen.ImportModal]: ImportModal,

	[ModalToOpen.FragmentAlreadyUseWarn]: FragmentAlreadyUseWarn,

	[ModalToOpen.Loading]: ModalLoading,

	[ModalToOpen.MultilangActionConfirm]: OtherLanguagesPresentWarning,

	[ModalToOpen.DiagramEditor]: DiagramsEditor,
	[ModalToOpen.HTMLEditor]: HTMLEditor,

	[ModalToOpen.Merge]: MergeModal,
	[ModalToOpen.CreateMergeRequest]: CreateMergeRequestModal,
	[ModalToOpen.MergeRequestConfirm]: MergeRequestConfirm,

	[ModalToOpen.CreateStorage]: CreateStorageModal,

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
	[ModalToOpen.UnsupportedElements]: CommonUnsupportedElementsModal,
	[ModalToOpen.Share]: ShareModal,
	[ModalToOpen.NotificationSettings]: NotificationSettingsModal,

	[ModalToOpen.CatalogPropsEditor]: CatalogPropsEditor,
	[ModalToOpen.Healthcheck]: Healthcheck,

	[ModalToOpen.ActionConfirm]: ActionConfirm,

	[ModalToOpen.ExportPdf]: ExportPdf,

	[ModalToOpen.GesAdmin]: lazy(() =>
		import("@ext/enterprise/components/admin/Admin").then((module) => ({ default: module.Admin })),
	),

	[ModalToOpen.DefaultModal]: DefaultModal,
	[ModalToOpen.UnsavedChangesModal]: UnsavedChangesModal,

	[ModalToOpen.RepositoryPermission]: lazy(() => import("@ext/enterprise/components/RepositoryPermissionModal")),

	[ModalToOpen.TauriGesSignIn]: SignInEnterpriseTauriForm,

	[ModalToOpen.GesCloudInitCatalog]: GesCloudInitCatalog,
	[ModalToOpen.GesCloudSignIn]: GesCloudSignInFormModal,
	[ModalToOpen.GesCloudInviteUser]: GesCloudInviteUserModal,
	[ModalToOpen.GesCloudInviteMismatch]: InviteMismatchModal,
	[ModalToOpen.GesCloudOrganizationSettings]: GesCloudOrganizationSettingsModal,
	[ModalToOpen.GesCloudSignOut]: GesCloudSignOutModal,

	[ModalToOpen.AlertConfirm]: AlertConfirm,
};

export default getModalComponentToRender;
