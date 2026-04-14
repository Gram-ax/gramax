use std::fs::File;
use std::io::BufWriter;
use std::path::Path;

use serde::Deserialize;
use serde::Serialize;

use zune_core::options::EncoderOptions;
use zune_image::image::Image;

#[derive(Serialize, Deserialize, Debug)]
#[serde(rename_all = "camelCase", tag = "target")]
pub enum ImageCompressOptions {
	Png {
		#[serde(default = "default_compression_level")]
		compression_level: u8,
	},
	Jpeg {
		#[serde(default = "default_quality")]
		quality: u8,
		#[serde(default = "default_effort")]
		effort: u8,
	},
	Webp {
		#[serde(default = "default_quality")]
		quality: u8,
		#[serde(default = "default_effort")]
		effort: u8,
	},
}

fn default_compression_level() -> u8 {
	6
}

fn default_quality() -> u8 {
	80
}

fn default_effort() -> u8 {
	4
}

#[derive(Clone, Copy, Debug)]
enum SourceFormat {
	Png,
	Jpeg,
	Webp,
}

impl SourceFormat {
	fn from_magic_bytes(data: &[u8]) -> Option<Self> {
		if data.len() >= 8 && &data[..8] == b"\x89PNG\r\n\x1a\n" {
			Some(Self::Png)
		} else if data.len() >= 3 && &data[..3] == b"\xFF\xD8\xFF" {
			Some(Self::Jpeg)
		} else if data.len() >= 4 && &data[..4] == b"RIFF" {
			Some(Self::Webp)
		} else {
			None
		}
	}

	fn decode<C: AsRef<[u8]>>(self, content: C) -> anyhow::Result<Image> {
		use zune_core::bytestream::ZCursor;
		use zune_image::codecs::jpeg::JpegDecoder;
		use zune_image::codecs::png::PngDecoder;
		use zune_image::codecs::webp::ZuneWebpDecoder;

		let cursor = ZCursor::new(content.as_ref());

		let image = match self {
			Self::Png => Image::from_decoder(PngDecoder::new(cursor)),
			Self::Jpeg => Image::from_decoder(JpegDecoder::new(cursor)),
			Self::Webp => Image::from_decoder(ZuneWebpDecoder::new(cursor)?),
		}?;

		Ok(image)
	}
}

fn encode_and_write(path: &Path, image: Image, target: TranscodeTarget, quality: u8, effort: u8) -> anyhow::Result<()> {
	use zune_image::codecs::jpeg::JpegEncoder;
	use zune_image::codecs::webp::ZuneWebpImageEncoder;
	use zune_image::traits::EncoderTrait;

	let writer = BufWriter::new(File::create(path)?);

	let (width, height) = image.dimensions();
	let opts = EncoderOptions::new(width, height, image.colorspace(), image.depth())
		.set_effort(effort)
		.set_quality(quality);

	match target {
		TranscodeTarget::Jpeg => {
			let mut encoder = JpegEncoder::default();
			encoder.set_options(opts);
			encoder.encode(&image, writer)?;
		}
		TranscodeTarget::Webp => {
			let mut encoder = ZuneWebpImageEncoder::new();
			encoder.set_options(opts);
			encoder.encode(&image, writer)?;
		}
	};

	Ok(())
}

#[derive(Clone, Copy, Debug)]
enum TranscodeTarget {
	Jpeg,
	Webp,
}

fn optimize_png<P: AsRef<Path>, C: AsRef<[u8]>>(path: P, content: C, compression_level: u8) -> anyhow::Result<()> {
	use oxipng::Deflater;

	let opts = oxipng::Options {
		deflater: Deflater::Libdeflater {
			compression: compression_level,
		},
		..Default::default()
	};

	let data = oxipng::optimize_from_memory(content.as_ref(), &opts)?;
	std::fs::write(path, data)?;
	Ok(())
}

fn transcode<P: AsRef<Path>, C: AsRef<[u8]>>(
	path: P,
	content: C,
	source: SourceFormat,
	target: TranscodeTarget,
	quality: u8,
	effort: u8,
) -> anyhow::Result<()> {
	let image = source.decode(content).map_err(|err| anyhow::anyhow!("failed to decode: {err}"))?;
	encode_and_write(path.as_ref(), image, target, quality, effort).map_err(|err| anyhow::anyhow!("failed to encode: {err}"))
}

pub fn write_compressed<P: AsRef<Path> + std::fmt::Debug, C: AsRef<[u8]>>(path: P, content: C, options: ImageCompressOptions) -> anyhow::Result<()> {
	let source = SourceFormat::from_magic_bytes(content.as_ref()).ok_or_else(|| anyhow::anyhow!("unknown source image format"))?;

	match options {
		ImageCompressOptions::Png { compression_level } => match source {
			SourceFormat::Png => optimize_png(&path, content, compression_level),
			_ => anyhow::bail!("cannot convert {source:?} to PNG"),
		},
		ImageCompressOptions::Jpeg { quality, effort } => transcode(&path, content, source, TranscodeTarget::Jpeg, quality, effort),
		ImageCompressOptions::Webp { quality, effort } => transcode(&path, content, source, TranscodeTarget::Webp, quality, effort),
	}
}
