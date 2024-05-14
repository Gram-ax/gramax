import Icon from "@components/Atoms/Icon";

export default function WhoWhen({ text, isWhen }: { text: string; isWhen: boolean }) {
	return (
		<span className="attr">
			<span className="delimiter">/</span>
			<Icon code={isWhen ? "clock" : "circle-user"} />
			<span>{text}</span>
		</span>
	);
}
