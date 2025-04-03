import styled from "@emotion/styled";

interface IndentLineProps {
	level: number;
	color: string;
	ignoreFirstLine?: boolean;
	containerMarginLeft?: string;
	gap?: string;
	className?: string;
}

const Line = styled.div<{ ignore: boolean }>`
	${({ ignore }) => ignore && `opacity: 0;`}
	width: 1px;
	height: 100%;
	background-color: ${({ color }) => color};
`;

const LinesWrapper = styled.div<{ gap: string; containerMarginLeft?: string }>`
	display: flex;
	gap: ${({ gap }) => gap};
	height: 100%;
	position: absolute;
	${({ containerMarginLeft }) => containerMarginLeft && `margin-left: ${containerMarginLeft};`}
`;

const IndentLine = ({ level, color, gap = "1rem", containerMarginLeft, ignoreFirstLine = false }: IndentLineProps) => {
	if (level < 1) return null;

	return (
		<LinesWrapper gap={gap} containerMarginLeft={containerMarginLeft}>
			{[...Array(level).keys()].map((idx) => (
				<Line key={idx} color={color} ignore={ignoreFirstLine && idx === 0} />
			))}
		</LinesWrapper>
	);
};

export default IndentLine;
