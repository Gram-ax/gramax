import Kanban from "@ext/markdown/elements/view/render/components/Displays/Kanban";
import List from "@ext/markdown/elements/view/render/components/Displays/List";
import Table from "@ext/markdown/elements/view/render/components/Displays/Table";
import { Display } from "@ext/properties/models/display";
import { ReactNode } from "react";

export const getDisplayComponent: {
	[type in Display]: (args: { [name: string]: any }) => ReactNode;
} = {
	[Display.List]: List,
	[Display.Kanban]: Kanban,
	[Display.Table]: Table,
};
