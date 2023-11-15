import WhoWhen from "./WhoWhen";

export default function Who({ text }: { text: string }) {
	return <WhoWhen text={text} isWhen={false} />;
}
