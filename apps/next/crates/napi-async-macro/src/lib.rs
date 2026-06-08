use proc_macro::TokenStream;
use quote::{format_ident, quote};
use syn::{parse_macro_input, FnArg, ItemFn, Pat, PatType};

enum OutputMode {
	Json,
	Buffer,
}

#[proc_macro_attribute]
pub fn napi_async(attr: TokenStream, item: TokenStream) -> TokenStream {
	let mode = match attr.to_string().trim() {
		"buffer" => OutputMode::Buffer,
		_ => OutputMode::Json,
	};

	let input_fn = parse_macro_input!(item as ItemFn);
	let fn_name = &input_fn.sig.ident;
	let fn_name_async = format_ident!("{}_async", fn_name);
	let fn_vis = &input_fn.vis;
	let fn_asyncness = input_fn.sig.asyncness;
	let fn_block = &input_fn.block;

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

	let mut field_defs = Vec::new();
	let mut param_names = Vec::new();
	let mut param_types = Vec::new();

	for arg in input_fn.sig.inputs.iter() {
		if let FnArg::Typed(PatType { pat, ty, .. }) = arg {
			if let Pat::Ident(pat_ident) = &**pat {
				let field_name = &pat_ident.ident;
				let field_type = &**ty;

				field_defs.push(quote! { #field_name: Option<#field_type> });
				param_names.push(field_name);
				param_types.push(field_type);
			}
		}
	}

	let (output_ty, jsvalue_ty, finish_body) = match mode {
		OutputMode::Json => (
			quote! { String },
			quote! { String },
			quote! {
				match __result {
					Ok(ok) => ::serde_json::to_string(&ok).map_err(|e| napi::Error::from_reason(e.to_string())),
					Err(err) => Err(napi::Error::from_reason(::serde_json::to_string(&err).unwrap_or_else(|e| e.to_string()))),
				}
			},
		),
		OutputMode::Buffer => (
			quote! { Vec<u8> },
			quote! { napi::bindgen_prelude::Buffer },
			quote! {
				__result.map_err(|err| napi::Error::from_reason(::serde_json::to_string(&err).unwrap_or_else(|e| e.to_string())))
			},
		),
	};

	let resolve_body = match mode {
		OutputMode::Json => quote! { Ok(output) },
		OutputMode::Buffer => quote! { Ok(output.into()) },
	};

	if fn_asyncness.is_some() {
		let expanded = quote! {
			#[napi(js_name = #fn_name)]
			#fn_vis #fn_asyncness fn #fn_name(
				#(#param_names: #param_types,)*
				span_id: Option<String>,
				trace_id: Option<String>,
			) -> crate::AsyncOutput {
				let _otel_guard = crate::setup_remote_context(span_id.as_deref(), trace_id.as_deref());
				let __result = #fn_block;
				#finish_body
			}
		};

		return TokenStream::from(expanded);
	}

	let expanded = quote! {
		pub struct #task_name {
			#(#field_defs,)*
			span_id: Option<String>,
			trace_id: Option<String>,
		}

		impl napi::Task for #task_name {
			type Output = #output_ty;
			type JsValue = #jsvalue_ty;

			fn compute(&mut self) -> napi::Result<Self::Output> {
				#(let #param_names = self.#param_names.take().expect(concat!("napi_async: ", stringify!(#param_names), " consumed twice"));)*
				let span_id = self.span_id.take();
				let trace_id = self.trace_id.take();
				let _otel_guard = crate::setup_remote_context(span_id.as_deref(), trace_id.as_deref());
				let __result = #fn_block;
				#finish_body
			}

			fn resolve(&mut self, _env: napi::Env, output: Self::Output) -> napi::Result<Self::JsValue> {
				#resolve_body
			}

			fn reject(&mut self, _: napi::Env, error: napi::Error) -> napi::Result<Self::JsValue> {
				Err(error)
			}
		}

		#[napi(js_name = #fn_name)]
		#fn_vis #fn_asyncness fn #fn_name_async(
			#(#param_names: #param_types,)*
			span_id: Option<String>,
			trace_id: Option<String>,
		) -> napi::bindgen_prelude::AsyncTask<#task_name> {
			napi::bindgen_prelude::AsyncTask::new(#task_name {
				#(#param_names: Some(#param_names),)*
				span_id,
				trace_id,
			})
		}
	};

	TokenStream::from(expanded)
}
