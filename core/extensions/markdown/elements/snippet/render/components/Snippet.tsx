import AlertError from "@components/AlertError";
import t from "@ext/localization/locale/translate";
import { ReactNode } from "react";
import styled from "@emotion/styled";
import ResourceService from "@ext/markdown/elements/copyArticles/resourceService";

const Wrapper = styled.div`
	margin: -4px -8px 0.2em -8px;
	padding: 4px 8px;
	*[data-focusable="true"] {
		outline: unset !important;
		outline-offset: unset !important;
	}
`;

interface SnippetProps {
	id: string;
	children: ReactNode;
}

const Snippet = ({ id, children }: SnippetProps) => {
	return children ? (
		<ResourceService.Provider id={id} provider="snippet">
			<Wrapper data-focusable="true" data-iseditable={false} data-component="snippet">
				{children}
			</Wrapper>
		</ResourceService.Provider>
	) : (
		<AlertError title={t("snippet-render-error")} error={{ message: t("cant-get-snippet-data") }} />
	);
};

export default Snippet;
