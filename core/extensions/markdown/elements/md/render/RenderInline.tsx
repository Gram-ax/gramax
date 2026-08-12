import Renderer from "@ext/markdown/core/render/components/Renderer";
import getMdComponents from "@ext/markdown/elements/md/render/getComponents/getMdComponents";

const RenderInline = ({ tag }) => {
	return (
		<div className="focus-pointer-events inline rounded-sm" data-focusable="true">
			{Renderer(tag, { components: getMdComponents() })}
		</div>
	);
};

export default RenderInline;
