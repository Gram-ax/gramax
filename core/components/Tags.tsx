import React from "react";

const Tags = ({ tags }: { tags: string[] }): JSX.Element => {
	if (!tags?.length) return null;

	return (
		<ul className="tags">
			{tags.map((tag, idx) => {
				return (
					<li key={idx}>
						<span>{tag}</span>
					</li>
				);
			})}
		</ul>
	);
};

export default Tags;
