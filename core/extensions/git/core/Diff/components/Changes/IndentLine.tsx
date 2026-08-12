interface IndentLineProps {
	level: number;
	color: string;
	ignoreFirstLine?: boolean;
	containerMarginLeft?: string;
	gap?: string;
}

const IndentLine = ({ level, color, gap = "1rem", containerMarginLeft, ignoreFirstLine = false }: IndentLineProps) => {
	if (level < 1) return null;

	return (
		<div className="flex h-5 absolute" style={{ gap, marginLeft: containerMarginLeft }}>
			{[...Array(level).keys()].map((idx) => (
				<div
					className="w-px h-full"
					key={idx}
					style={{
						backgroundColor: color,
						opacity: ignoreFirstLine && idx === 0 ? 0 : undefined,
					}}
				/>
			))}
		</div>
	);
};

export default IndentLine;
