import Renderer from "@ext/markdown/core/render/components/Renderer";
import getMdComponents from "@ext/markdown/elements/md/render/getComponents/getMdComponents";

const RenderBlock = ({ tag }) => {
	return (
		<div className="overflow-x-auto overflow-y-hidden">
			<div className="focus-pointer-events">{Renderer(tag, { components: getMdComponents() })}</div>
		</div>
	);
};

export default RenderBlock;
