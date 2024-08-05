import AlertError from "@components/AlertError";
import t from "@ext/localization/locale/translate";
import { ReactNode } from "react";

const Snippet = ({ children }: { children?: ReactNode }) => {
	return children ? (
		<div data-focusable="true">{children}</div>
	) : (
		<AlertError title={t("snippet-render-error")} error={{ message: t("cant-get-snippet-data") }} />
	);
};

export default Snippet;
