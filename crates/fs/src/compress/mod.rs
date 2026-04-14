use std::path::Path;

use serde::Deserialize;
use serde::Serialize;

use crate::compress::image::ImageCompressOptions;

pub mod image;

#[derive(Serialize, Deserialize, Debug)]
#[serde(rename_all = "camelCase", tag = "type")]
#[non_exhaustive]
pub enum CompressOptions {
	Image(ImageCompressOptions),
	Unsupported,
}

pub fn write_compressed<P: AsRef<Path> + std::fmt::Debug, C: AsRef<[u8]>>(path: P, content: C, compress: CompressOptions) -> std::io::Result<()> {
	match compress {
		CompressOptions::Image(options) => image::write_compressed(path, content, options).map_err(std::io::Error::other),
		compress => {
			warn!(?compress, "unsupported compress type, writing uncompressed");
			std::fs::write(path, content)
		}
	}
}
