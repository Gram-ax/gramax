import Icon from "@components/Atoms/Icon";

interface IconWithTextProps {
	iconCode: string;
	text: string;
	iconColor?: string;
	className?: string;
}

const IconWithText = ({ iconCode, text, iconColor, className }: IconWithTextProps) => (
	<span className={className} style={{ display: "flex", alignItems: "center", gap: "0.25em" }}>
		<Icon code={iconCode} style={{ color: iconColor }} />
		{text}
	</span>
);

export default IconWithText;
