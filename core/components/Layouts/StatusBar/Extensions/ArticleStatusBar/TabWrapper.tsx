import Header from "@components/Layouts/StatusBar/Extensions/ArticleStatusBar/Header";
import styled from "@emotion/styled";

const Wrapper = styled.div<{ show: boolean }>`
	width: 100%;
	display: ${({ show }) => (show ? "block" : "none")};
	font-size: 12px;
	background-color: var(--color-merge-request-bg);
	color: var(--color-merge-request-text);

	line-height: 1.6;

	border-width: 1px 1px 0px 0px;
	border-style: solid;
	border-color: var(--color-merge-request-border);

	padding: 0.92em 0;
	gap: 0.8em;
`;

const TabWrapper = ({
	children,
	show,
	title,
	titleRightExtension,
	onClose,
}: {
	children: JSX.Element;
	show: boolean;
	title: string;
	titleRightExtension?: JSX.Element;
	onClose: () => void;
}) => {
	return (
		<Wrapper show={show}>
			<Header title={title} rightExtension={titleRightExtension} onClose={onClose} />
			{children}
		</Wrapper>
	);
};

export default TabWrapper;
