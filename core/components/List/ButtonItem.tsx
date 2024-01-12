import Icon from "@components/Atoms/Icon";
import { ButtonItem, ListItem } from "@components/List/Item";
import styled from "@emotion/styled";

export const parseButton = (button: ButtonItem & { isLastButton: boolean }): ListItem => {
	const content =
		typeof button.element === "string" ? (
			<div style={{ width: "100%" }}>
				<StyledDiv>
					{button.icon && <Icon code={button.icon} />}
					<div>{button.element}</div>
				</StyledDiv>
				{button.isLastButton && <Devider />}
			</div>
		) : (
			button.element
		);

	return {
		element: content,
		disable: button.disable,
		labelField: button.labelField,
	};
};

const Devider = () => (
	<div style={{ width: "100%", height: "0.2px", background: "var(--color-line)", opacity: "0.5" }} />
);

const StyledDiv = styled.div`
	display: flex;
	align-items: center;
	width: 100%;
	gap: 0.5rem;
	height: 31.8px;
	font-size: 14px;
	color: var(--color-article-heading-text);
	padding: 6px 12px;
`;
