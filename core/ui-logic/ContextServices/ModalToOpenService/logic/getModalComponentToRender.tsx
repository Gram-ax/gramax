import ModalLoading from "@components/ModalLoading";
import CheckoutHandler from "@ext/git/core/GitPathnameHandler/checkout/components/CheckoutHandler";
import CloneHandler from "@ext/git/core/GitPathnameHandler/clone/components/CloneHandler";
import PullHandler from "@ext/git/core/GitPathnameHandler/pull/components/PullHandler";
import SnippetAlreadyUseWarn from "@ext/markdown/elements/snippet/edit/components/SnippetAlreadyUseWarn";
import SnippetEditor from "@ext/markdown/elements/snippet/edit/components/SnippetEditor";
import { ReactNode } from "react";
import ReviewTicketHandler from "../../../../extensions/catalog/actions/review/components/ReviewTicketHandler";
import ShareTicketHandler from "../../../../extensions/catalog/actions/share/components/ShareTicketHandler";
import ErrorMergeConflictHandler from "../../../../extensions/git/actions/MergeConflictHandler/error/components/ErrorMergeConflictHandler";
import ModalToOpen from "../model/ModalsToOpen";

const getModalComponentToRender: {
	[type in ModalToOpen]: (args: { [name: string]: any }) => ReactNode;
} = {
	[ModalToOpen.Merge]: ErrorMergeConflictHandler,

	[ModalToOpen.ShareTicketHandler]: ShareTicketHandler,
	[ModalToOpen.ReviewTicketHandler]: ReviewTicketHandler,

	[ModalToOpen.CheckoutHandler]: CheckoutHandler,
	[ModalToOpen.PullHandler]: PullHandler,
	[ModalToOpen.CloneHandler]: CloneHandler,

	[ModalToOpen.SnippetEditor]: SnippetEditor,
	[ModalToOpen.SnippetAlreadyUseWarn]: SnippetAlreadyUseWarn,

	[ModalToOpen.Loading]: ModalLoading,
};

export default getModalComponentToRender;
