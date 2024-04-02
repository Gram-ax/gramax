import SnipperError from "@ext/markdown/elements/snippet/edit/components/SnippetError";
import { ReactNode } from "react";

const Snippet = ({ children }: { children?: ReactNode }) => {
	return children ? children : <SnipperError />;
};

export default Snippet;
