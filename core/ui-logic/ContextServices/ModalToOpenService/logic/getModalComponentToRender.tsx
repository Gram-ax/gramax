import ModalLoading from "@components/ModalLoading";
import MergeConflictConfirm from "@ext/git/actions/MergeConflictHandler/components/MergeConflictConfirm";
import MergeResolver from "@ext/git/actions/MergeConflictHandler/components/MergeResolver";
import CheckoutHandler from "@ext/git/core/GitPathnameHandler/checkout/components/CheckoutHandler";
import CloneHandler from "@ext/git/core/GitPathnameHandler/clone/components/CloneHandler";
import PullHandler from "@ext/git/core/GitPathnameHandler/pull/components/PullHandler";
import ActionWarning from "@ext/localization/actions/ActionWarning";
import DiagramsEditor from "@ext/markdown/elements/diagrams/edit/components/DiagramsEditor";
import DrawioEditButton from "@ext/markdown/elements/drawio/edit/components/DrawioEditButton";
import SnippetAlreadyUseWarn from "@ext/markdown/elements/snippet/edit/components/SnippetAlreadyUseWarn";
import SnippetEditor from "@ext/markdown/elements/snippet/edit/components/SnippetEditor";
import { ReactNode } from "react";
import ReviewTicketHandler from "../../../../extensions/catalog/actions/review/components/ReviewTicketHandler";
import ShareTicketHandler from "../../../../extensions/catalog/actions/share/components/ShareTicketHandler";
import ModalToOpen from "../model/ModalsToOpen";
import Publish from "@ext/git/actions/Publish/components/Publish";

const getModalComponentToRender: {
	[type in ModalToOpen]: (args: { [name: string]: any }) => ReactNode;
} = {
	[ModalToOpen.MergeConfirm]: MergeConflictConfirm,
	[ModalToOpen.MergeResolver]: MergeResolver,

	[ModalToOpen.Publish]: Publish,

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
	[ModalToOpen.DrawioEditor]: DrawioEditButton,
};

export default getModalComponentToRender;
