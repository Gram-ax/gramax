import Cmd from "@ext/markdown/elements/cmd/render/Cmd";
import DbDiagram from "@ext/markdown/elements/diagramdb/render/DbDiagram";
import Formula from "@ext/markdown/elements/formula/render/Formula";
import Images from "@ext/markdown/elements/imgs/render/Images";
import Include from "@ext/markdown/elements/include/render/Include";
import Issue from "@ext/markdown/elements/issue/render/Issue";
import Kbd from "@ext/markdown/elements/kbd/render/Kbd";
import Module from "@ext/markdown/elements/module/render/Module";
import See from "@ext/markdown/elements/see/render/See";
import DbTable from "@ext/markdown/elements/tabledb/render/DbTable";
import Term from "@ext/markdown/elements/term/render/Term";
import When from "@ext/markdown/elements/whowhen/render/When";
import Who from "@ext/markdown/elements/whowhen/render/Who";
import type { ReactNode } from "react";

// biome-ignore lint/suspicious/noExplicitAny: dynamic component registry requires any
const getMdComponents = (): { [name: string]: (props: any) => ReactNode } => {
	return {
		Include,
		"Db-diagram": DbDiagram,
		"Db-table": DbTable,
		"Img-h": Images,
		"Img-v": Images,
		Formula,
		Module,
		Term,
		Issue,
		Alfa: () => <span className="alfa" />,
		Beta: () => <span className="beta" />,
		Who,
		When,
		Kbd,
		See,
		Cmd,
		Sub: ({ children }: { children: JSX.Element }) => <sub>{children}</sub>,
	};
};

export default getMdComponents;
