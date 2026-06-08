use crate::error::Result;

#[derive(Debug, serde::Deserialize)]
pub struct MdFrontmatter {
	pub title: Option<String>,
}

pub struct ParsedMdFile {
	pub frontmatter: MdFrontmatter,
	pub content: String,
}

pub struct MdFrontmatterParser;

impl MdFrontmatterParser {
	pub fn parse(&self, content: &str) -> Result<ParsedMdFile> {
		let frontmatter = self.parse_frontmatter(content)?;
		let body = content.strip_prefix("---\n").and_then(|s| {
			let end = s.find("\n---")?;
			Some(s[end + 4..].to_string())
		});
		Ok(ParsedMdFile { frontmatter, content: body.unwrap_or_default() })
	}

	pub fn parse_frontmatter(&self, content: &str) -> Result<MdFrontmatter> {
		let frontmatter = content.strip_prefix("---\n").and_then(|s| {
			let end = s.find("\n---")?;
			serde_yml::from_str(&s[..end]).ok()
		});
		Ok(frontmatter.unwrap_or(MdFrontmatter { title: None }))
	}
}
