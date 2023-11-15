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
};

export default getModalComponentToRender;
