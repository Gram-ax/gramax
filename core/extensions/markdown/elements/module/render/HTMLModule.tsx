import type HTMLComponents from "../../../core/render/components/getComponents/HTMLComponents";

export interface HTMLModuleProps {
	id?: string;
}

const HTMLModule = (html: HTMLComponents) => {
	return (props: HTMLModuleProps) => (
		<span data-component="module">
			{html.renderIcon({ code: "box" })}
			{props.id}
		</span>
	);
};

export default HTMLModule;
