"use client";

import { Editor } from "@tinymce/tinymce-react";
import {
	Controller,
	type Control,
	type FieldValues,
	type Path,
	type RegisterOptions,
} from "react-hook-form";

import { Label } from "@/components/ui/label";

interface CustomTextEditorProps<T extends FieldValues> {
	name: Path<T>;
	control: Control<T>;
	label?: string;
	rules?: Omit<
		RegisterOptions<T, Path<T>>,
		"valueAsNumber" | "valueAsDate" | "setValueAs" | "disabled"
	>;
	height?: number;
	disabled?: boolean;
	language?: "en" | "ar";
}

/**
 * TinyMCE rich-text editor wired into react-hook-form via Controller.
 * Controlled mode only (value + onEditorChange, never initialValue).
 */
export function CustomTextEditor<T extends FieldValues>({
	name,
	control,
	label,
	rules,
	height = 500,
	disabled = false,
	language = "en",
}: CustomTextEditorProps<T>) {
	const isRtl = language === "ar";

	return (
		<Controller
			name={name}
			control={control}
			rules={rules}
			render={({ field, fieldState }) => (
				<div className="space-y-2">
					{label && <Label htmlFor={String(name)}>{label}</Label>}
					<Editor
						// Remount when the language changes so directionality applies
						key={`${String(name)}-${language}`}
						apiKey={
							process.env.NEXT_PUBLIC_TINYMCE_API_KEY ||
							"lsm8vcnnrspl2e72cz1p8xd5smhdk3xj3hob14i7fwy29lap"
						}
						value={field.value || ""}
						onEditorChange={(content) => field.onChange(content)}
						disabled={disabled}
						onInit={(_evt, editor) => {
							editor.getBody().dir = isRtl ? "rtl" : "ltr";
						}}
						init={{
							height,
							menubar: true,
							// No `language:` here on purpose — the UI langpack download is
							// an avoidable failure point; content directionality is what matters.
							directionality: isRtl ? "rtl" : "ltr",
							plugins: [
								"advlist",
								"autolink",
								"lists",
								"link",
								"image",
								"charmap",
								"preview",
								"anchor",
								"searchreplace",
								"visualblocks",
								"visualchars",
								"code",
								"fullscreen",
								"insertdatetime",
								"media",
								"table",
								"help",
								"wordcount",
								"emoticons",
								"pagebreak",
								"nonbreaking",
								"directionality",
								"codesample",
							],
							toolbar:
								"undo redo | blocks fontfamily fontsize | " +
								"bold italic underline strikethrough forecolor backcolor | " +
								"alignleft aligncenter alignright alignjustify | " +
								"bullist numlist outdent indent | ltr rtl | " +
								"link image media table | charmap emoticons codesample | " +
								"removeformat | preview fullscreen code | help",
							content_style: `body { font-family: Helvetica, Arial, sans-serif; font-size: 14px; direction: ${
								isRtl ? "rtl" : "ltr"
							}; text-align: ${isRtl ? "right" : "left"}; }`,
						}}
					/>
					{fieldState.error && (
						<p className="text-sm font-medium text-destructive">
							{fieldState.error.message}
						</p>
					)}
				</div>
			)}
		/>
	);
}
