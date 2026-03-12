import AlertError from "@components/AlertError";
import ResourceService from "@core-ui/ContextServices/ResourceService/ResourceService";
import styled from "@emotion/styled";
import t from "@ext/localization/locale/translate";
import type { ReactNode } from "react";

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
			<Wrapper data-component="snippet" data-focusable="true" data-iseditable={false}>
				{children}
			</Wrapper>
		</ResourceService.Provider>
	) : (
		<AlertError error={{ message: t("cant-get-snippet-data") }} title={t("snippet-render-error")} />
	);
};

export default Snippet;
