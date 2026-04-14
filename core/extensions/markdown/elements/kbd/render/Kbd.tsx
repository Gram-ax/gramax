import { Shortcut } from "@ui-kit/Shortcut";

export default function Kbd({ text }: { text: string }) {
	return <Shortcut value={text} />;
}
