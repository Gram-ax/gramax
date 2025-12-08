import {
	BlockPlus,
	ListGroup,
	WrappableBlocks,
} from "@core-ui/ContextServices/ButtonStateService/hooks/useCurrentAction";

export const BlockPlusAndSubNodes = [...BlockPlus, ...WrappableBlocks, "tableRow", "tableCell"];
export const ListGroupAndItem = [...ListGroup, "listItem"];
