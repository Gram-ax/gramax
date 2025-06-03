import Icon from "@components/Atoms/Icon";
import styled from "@emotion/styled";
import t from "@ext/localization/locale/translate";

const Title = styled.span`
	font-size: 14px;
	text-transform: uppercase;
	font-weight: 400;
	white-space: nowrap;
`;

const Wrapper = styled.span`
	display: flex;
	align-items: center;
	margin-bottom: 0.4em;
	line-height: 16px;
	justify-content: space-between;
	padding-bottom: 0.1em;
	padding-left: 1rem;
	padding-right: 1rem;
`;

const Part = styled.span`
	display: flex;
	align-items: center;
	flex-wrap: nowrap;
	gap: 0.85em;
	max-width: 85%;
	overflow-y: hidden;
	overflow-x: auto;
	scrollbar-width: none;
	-ms-overflow-style: none;
	::-webkit-scrollbar {
		display: none;
	}
`;

const CloseIcon = styled(Icon)`
	font-size: 2em;
	cursor: pointer;
	svg {
		stroke-width: 1px;
	}
`;

const IconMargin = styled.div`
	margin-right: -5px;
`;

export type HeaderProps = {
	title: string;
	show: boolean;
	onClose?: () => void;
	rightExtension?: JSX.Element;
};

const Header = (props: HeaderProps) => {
	const { title, rightExtension, onClose, show } = props;

	return (
		<Wrapper>
			<Part>
				<Title className="tab-wrapper-title">{title}</Title>
				{rightExtension}
			</Part>
			{onClose && (
				<Part>
					<IconMargin>
						<CloseIcon
							strokeWidth={1.2}
							tooltipContent={show ? t("close") : null}
							code="x"
							onClick={onClose}
						/>
					</IconMargin>
				</Part>
			)}
		</Wrapper>
	);
};

export default Header;
