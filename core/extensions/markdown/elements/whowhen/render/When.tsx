import WhoWhen from "./WhoWhen";

export default function When({ text }: { text: string }) {
	return <WhoWhen text={text} isWhen={true} />;
}
