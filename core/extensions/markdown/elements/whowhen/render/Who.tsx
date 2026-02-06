import WhoWhen from "./WhoWhen";

export default function Who({ text }: { text: string }) {
	return <WhoWhen isWhen={false} text={text} />;
}
