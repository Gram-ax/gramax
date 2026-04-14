import Icon from "@components/Atoms/Icon";

export default function Module({ id }: { id: string }) {
	return (
		<span className="module">
			<Icon code="box" strokeWidth="2" style={{ paddingRight: "4px" }} />
			{id}
		</span>
	);
}
