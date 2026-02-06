import Icon from "@components/Atoms/Icon";
import { Button } from "@ui-kit/Button";

export default function Cmd({ icon, text }: { icon: string; text: string }) {
	return (
		<Button size="xs" variant="outline">
			{icon ? <Icon code={icon} /> : null}
			{text && <span>{text}</span>}
		</Button>
	);
}
