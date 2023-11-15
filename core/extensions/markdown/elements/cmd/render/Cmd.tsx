import Icon from "@components/Atoms/Icon";

export default function Cmd({ icon, text }: { icon: string; text: string }) {
	return (
		<span className="cmd" data-icon={icon}>
			{icon ? <Icon code={icon} /> : null}
			{text && <span>{text}</span>}
		</span>
	);
}
