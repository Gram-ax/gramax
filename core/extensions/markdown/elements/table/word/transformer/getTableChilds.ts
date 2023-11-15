import { tbodyWordLayout } from "../tbody";
import { tdWordLayout } from "../td";
import { thWordLayout } from "../th";
import { theadWordLayout } from "../thead";
import { trWordLayout } from "../tr";
import { WordTableChilds } from "./WordTableExportTypes";

export const getTableChilds: () => WordTableChilds = () => ({
	thead: theadWordLayout,
	tbody: tbodyWordLayout,
	td: tdWordLayout,
	tr: trWordLayout,
	th: thWordLayout,
});
