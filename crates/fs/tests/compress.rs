use gramaxfs::compress::{write_compressed, CompressOptions};
use rstest::*;
use std::fs;
use tempfile::TempDir;

const TEST_PNG: &[u8] = include_bytes!("test-1.png");

fn compress_png_and_check(source: &[u8], filename: &str, compression_level: u8) -> Vec<u8> {
	let dir = TempDir::new().unwrap();
	let out_path = dir.path().join(filename);

	let json = format!(r#"{{"type":"image","target":"png","compressionLevel":{compression_level}}}"#);
	let options: CompressOptions = serde_json::from_str(&json).unwrap();
	write_compressed(&out_path, source, options).unwrap();

	let compressed = fs::read(&out_path).unwrap();
	assert!(!compressed.is_empty(), "compressed file should not be empty");
	compressed
}

fn transcode_and_check(source: &[u8], filename: &str, target: &str, quality: u8, effort: u8) -> Vec<u8> {
	let dir = TempDir::new().unwrap();
	let out_path = dir.path().join(filename);

	let json = format!(r#"{{"type":"image","target":"{target}","quality":{quality},"effort":{effort}}}"#);
	let options: CompressOptions = serde_json::from_str(&json).unwrap();
	write_compressed(&out_path, source, options).unwrap();

	let compressed = fs::read(&out_path).unwrap();
	assert!(!compressed.is_empty(), "compressed file should not be empty");
	compressed
}

fn assert_decodable_png(data: &[u8]) {
	use zune_core::bytestream::ZCursor;
	use zune_image::codecs::png::PngDecoder;
	use zune_image::image::Image;
	let img = Image::from_decoder(PngDecoder::new(ZCursor::new(data))).expect("should decode as PNG");
	let (w, h) = img.dimensions();
	assert!(w > 0 && h > 0);
}

fn assert_decodable_jpeg(data: &[u8]) {
	use zune_core::bytestream::ZCursor;
	use zune_image::codecs::jpeg::JpegDecoder;
	use zune_image::image::Image;
	let img = Image::from_decoder(JpegDecoder::new(ZCursor::new(data))).expect("should decode as JPEG");
	let (w, h) = img.dimensions();
	assert!(w > 0 && h > 0);
}

fn assert_decodable_webp(data: &[u8]) {
	use zune_core::bytestream::ZCursor;
	use zune_image::codecs::webp::ZuneWebpDecoder;
	use zune_image::image::Image;
	let decoder = ZuneWebpDecoder::new(ZCursor::new(data)).expect("should create webp decoder");
	let img = Image::from_decoder(decoder).expect("should decode as WebP");
	let (w, h) = img.dimensions();
	assert!(w > 0 && h > 0);
}

// PNG -> PNG (oxipng optimization)
#[rstest]
#[case(1)]
#[case(6)]
#[case(12)]
fn compress_png_to_png(#[case] compression_level: u8) {
	let compressed = compress_png_and_check(TEST_PNG, "out.png", compression_level);
	assert_decodable_png(&compressed);
}

// PNG -> JPEG (zune transcode)
#[rstest]
#[case(80, 5)]
#[case(50, 1)]
#[case(90, 9)]
fn compress_png_to_jpeg(#[case] quality: u8, #[case] effort: u8) {
	let compressed = transcode_and_check(TEST_PNG, "out.jpg", "jpeg", quality, effort);
	assert!(
		compressed.len() < TEST_PNG.len(),
		"JPEG ({}) should be smaller than original PNG ({})",
		compressed.len(),
		TEST_PNG.len()
	);
	assert_decodable_jpeg(&compressed);
}

// PNG -> WebP (zune transcode)
#[rstest]
#[case(80, 5)]
#[case(50, 1)]
#[case(90, 9)]
fn compress_png_to_webp(#[case] quality: u8, #[case] effort: u8) {
	let compressed = transcode_and_check(TEST_PNG, "out.webp", "webp", quality, effort);
	assert!(
		compressed.len() < TEST_PNG.len(),
		"WebP ({}) should be smaller than original PNG ({})",
		compressed.len(),
		TEST_PNG.len()
	);
	assert_decodable_webp(&compressed);
}

// JPEG -> WebP
#[rstest]
fn compress_jpeg_to_webp() {
	let jpeg = transcode_and_check(TEST_PNG, "intermediate.jpg", "jpeg", 90, 5);
	let webp = transcode_and_check(&jpeg, "out.webp", "webp", 80, 5);
	assert_decodable_webp(&webp);
}

// JPEG -> PNG should fail (unsupported)
#[rstest]
fn compress_jpeg_to_png_fails() {
	let jpeg = transcode_and_check(TEST_PNG, "intermediate.jpg", "jpeg", 90, 5);

	let dir = TempDir::new().unwrap();
	let out_path = dir.path().join("out.png");
	let json = r#"{"type":"image","target":"png","compressionLevel":6}"#;
	let options: CompressOptions = serde_json::from_str(json).unwrap();

	let result = write_compressed(&out_path, &jpeg, options);
	assert!(result.is_err(), "JPEG → PNG should be unsupported");
}

// Quality comparison
#[rstest]
fn lower_quality_produces_smaller_file() {
	let high = transcode_and_check(TEST_PNG, "high.jpg", "jpeg", 95, 5);
	let low = transcode_and_check(TEST_PNG, "low.jpg", "jpeg", 30, 5);
	assert!(
		low.len() < high.len(),
		"lower quality ({}) should produce smaller file than higher quality ({})",
		low.len(),
		high.len()
	);
}
