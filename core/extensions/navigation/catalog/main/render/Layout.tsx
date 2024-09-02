import styled from "@emotion/styled";

export default styled(({ children, className }: { children: JSX.Element; className?: string }) => {
	return <div className={className}>{children}</div>;
})`
	margin-bottom: 1.5rem;

	> div > ul > li {
		font-size: 13px;
		margin-top: 20px;
		font-weight: 500;
		align-items: center;
		text-transform: uppercase;
	}

	ul {
		list-style: none;

		> li {
			width: 100%;
			margin-bottom: 0;
			text-transform: none;
		}
	}

	.depth-0,
	.depth-1 {
		--left-padding: 20px;
	}
	.depth-2 {
		--left-padding: 30px;
	}
	.depth-3 {
		--left-padding: 40px;
	}
	.depth-4 {
		--left-padding: 50px;
	}
	.depth-5 {
		--left-padding: 60px;
	}
	.depth-6 {
		--left-padding: 70px;
	}
	.depth-7 {
		--left-padding: 80px;
	}
	.depth-8 {
		--left-padding: 90px;
	}
`;
