use proc_macro::TokenStream;
use quote::{format_ident, quote};
use syn::{parse_macro_input, FnArg, ItemFn, Pat, PatType};

#[proc_macro_attribute]
pub fn napi_async(_attr: TokenStream, item: TokenStream) -> TokenStream {
	let input_fn = parse_macro_input!(item as ItemFn);
	let fn_name = &input_fn.sig.ident;
	let fn_name_async = format_ident!("{}_async", fn_name);
	let fn_vis = &input_fn.vis;
	let fn_block = &input_fn.block;

	let mut field_defs = Vec::new();
	let mut param_names = Vec::new();
	let mut param_types = Vec::new();

	let task_name_str = fn_name
		.to_string()
		.split('_')
		.map(|s| {
			let mut c = s.chars();
			match c.next() {
				None => String::new(),
				Some(f) => f.to_uppercase().collect::<String>() + c.as_str(),
			}
		})
		.collect::<String>()
		+ "Task";

	let task_name = format_ident!("{}", task_name_str);

	for arg in input_fn.sig.inputs.iter() {
		if let FnArg::Typed(PatType { pat, ty, .. }) = arg {
			if let Pat::Ident(pat_ident) = &**pat {
				let field_name = &pat_ident.ident;
				let field_type = &**ty;

				field_defs.push(quote! { #field_name: #field_type });

				param_names.push(field_name);
				param_types.push(field_type);
			}
		}
	}

	let expanded = quote! {
		pub struct #task_name {
				#(#field_defs),*
		}

		impl napi::Task for #task_name {
			type Output = String;
			type JsValue = napi::JsString;

			fn compute(&mut self) -> napi::Result<Self::Output> {
				let #task_name { #(#param_names),*, .. } = self;
				#fn_name(#(#param_names.clone().into()),*)
			}

			fn resolve(&mut self, env: napi::Env, output: Self::Output) -> napi::Result<Self::JsValue> {
				env.create_string(output.as_str())
			}

			fn reject(&mut self, _: napi::Env, error: napi::Error) -> napi::Result<Self::JsValue> {
				Err(error)
			}
		}

		#fn_vis fn #fn_name(#(#param_names: #param_types),*) -> Output {
			#fn_block.json()
		}

		#[napi(js_name = #fn_name)]
		#fn_vis fn #fn_name_async(#(#param_names: #param_types),*) -> napi::bindgen_prelude::AsyncTask<#task_name> {
			napi::bindgen_prelude::AsyncTask::new(#task_name { #(#param_names),* })
		}
	};

	TokenStream::from(expanded)
}
