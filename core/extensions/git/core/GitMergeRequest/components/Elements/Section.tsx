import Icon from "@components/Atoms/Icon";
import SpinnerLoader from "@components/Atoms/SpinnerLoader";
import ButtonLink from "@components/Molecules/ButtonLink";
import { css } from "@emotion/react";
import styled from "@emotion/styled";

export const Header = styled.span<{ styles?: string; chevron?: boolean }>`
	${({ styles }) => styles || ""}
	display: flex;
	align-items: center;
	justify-content: center;

	> div:first-of-type {
		flex: 1;
		${({ chevron }) =>
			chevron
				? css`
						cursor: pointer;
				  `
				: css`
						pointer-events: none;
				  `}
		text-transform: uppercase;
	}
`;

export type SectionProps = {
	title: string;

	isCollapsed?: boolean;
	isLoading?: boolean;
	isNotLoaded?: boolean;
	onHeaderClick?: () => void;
	headerStyles?: string;
	chevron?: boolean;

	right?: React.ReactNode;
	children: React.ReactNode;
};

const Wrapper = styled.div`
	margin: 1.15em 0;
`;

const Content = styled.div<{ hidden?: boolean }>`
	display: ${({ hidden }) => (hidden ? "none" : "block")};
`;

const ShiftedIcon = styled(Icon)`
	margin-left: -1em;
	font-size: 1rem;
`;

const Section = (props: SectionProps) => {
	const {
		title,
		isCollapsed,
		chevron = true,
		onHeaderClick,
		right,
		children,
		isLoading,
		isNotLoaded,
		headerStyles,
	} = props;

	return (
		<Wrapper>
			<Header styles={headerStyles} chevron={chevron}>
				{chevron && <ShiftedIcon code={isCollapsed || isNotLoaded ? "chevron-right" : "chevron-down"} />}
				<ButtonLink
					onClick={onHeaderClick}
					iconStyle={{ fontSize: "1rem", marginLeft: "-0.4rem", marginRight: "-0.3rem" }}
					text={title}
					rightActions={[isLoading && <SpinnerLoader key={1} width={12} height={12} lineWidth={1.5} />]}
				/>
				{right}
			</Header>
			<Content hidden={isCollapsed}>{children}</Content>
		</Wrapper>
	);
};

export default Section;
