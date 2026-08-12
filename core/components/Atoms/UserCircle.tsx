// biome-ignore lint/style/noRestrictedImports: legacy styled component, migrate to Tailwind later
import styled from "@emotion/styled";
import { useSetting } from "@ext/settings/logic/hooks";
import hsluv from "hsluv";
import Theme from "../../extensions/Theme/Theme";

const getHue = (name: string) => {
	let hash = 5381;
	for (let i = 0; i < name.length; i++) hash = Math.imul(hash, 33) ^ name.charCodeAt(i);
	return ((hash >>> 0) % 18) * 20;
};

const UserCircle = styled(({ name, className }: { name: string; className?: string }) => {
	const hue = getHue(name);
	const [theme] = useSetting("general.theme");
	const saturation = theme === Theme.dark ? 52 : 50;
	const lightness = theme === Theme.dark ? 60 : 80;
	return (
		<div
			className={className}
			style={{
				backgroundColor: hsluv.hsluvToHex([hue, saturation, lightness]),
			}}
		>
			<div>{name?.split(" ").map((s, i) => (i < 2 ? s[0] : null))}</div>
		</div>
	);
})`
	width: 2.4em;
	height: 2.4em;
	display: flex;
	font-size: 1em;
	font-weight: 500;
	align-items: center;
	border-radius: 3rem;
	justify-content: center;

	> div {
		opacity: 0.4;
		color: rgb(0 0 0);
		text-transform: uppercase;
	}
`;

export default UserCircle;
