import styled from "@emotion/styled";
import hsluv from "hsluv";
import objectHash from "object-hash";
import Theme from "../../extensions/Theme/Theme";
import ThemeService from "../../extensions/Theme/components/ThemeService";

const UserCircle = styled(({ name, className }: { name: string; className?: string }) => {
	const hue: number = (Number(objectHash({ i: name }).replace(/[^\d;]/g, "")) % 18) * 20;
	const theme = ThemeService.value;
	const saturation = theme === Theme.dark ? 52 : 50;
	const lightness = theme === Theme.dark ? 60 : 80;
	return (
		<div
			className={className}
			style={{
				backgroundColor: hsluv.hsluvToHex([hue, saturation, lightness]),
			}}
		>
			<div>{name.split(" ").map((s, i) => (i < 2 ? s[0] : null))}</div>
		</div>
	);
})`
	width: 39px;
	height: 39px;
	display: flex;
	font-size: 15px;
	font-weight: 500;
	align-items: center;
	border-radius: 3rem;
	justify-content: center;

	> div {
		color: rgb(0 0 0);
		margin-top: 1px;
		opacity: 0.4;
		text-transform: uppercase;
	}
`;

export default UserCircle;
