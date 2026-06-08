#[napi(object, use_nullable = true)]
#[derive(Clone)]
pub struct GcOptions {
	pub loose_objects_limit: Option<i32>,
	pub pack_files_limit: Option<i32>,
}

impl From<GcOptions> for gramaxgit::ext::gc::GcOptions {
	fn from(val: GcOptions) -> Self {
		gramaxgit::ext::gc::GcOptions {
			loose_objects_limit: val.loose_objects_limit.map(|x| x as usize),
			pack_files_limit: val.pack_files_limit.map(|x| x as usize),
		}
	}
}
