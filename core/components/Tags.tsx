import React from "react";

const Tags = ({ tags }: { tags: string[] }): JSX.Element => {
	if (!tags) tags = [];
	return (
		<>
			{tags.length ? (
				<ul className="tags">
					{tags.map((tag, idx) => {
						return (
							<li key={idx}>
								<span>{tag}</span>
							</li>
						);
					})}
				</ul>
			) : null}
		</>
	);
};

export default Tags;
