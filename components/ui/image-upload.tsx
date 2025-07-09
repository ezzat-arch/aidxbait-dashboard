"use client";

import { useState, useRef } from "react";
import { Upload, X, ImageIcon, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";

interface ImageUploadProps {
	value?: string;
	onChange: (url: string) => void;
	onRemove?: () => void;
	uploadEndpoint: string;
	label?: string;
	description?: string;
	disabled?: boolean;
	required?: boolean;
	maxSizeMB?: number;
	acceptedFileTypes?: string[];
	className?: string;
}

export function ImageUpload({
	value,
	onChange,
	onRemove,
	uploadEndpoint,
	label = "Image",
	description,
	disabled = false,
	required = false,
	maxSizeMB = 5,
	acceptedFileTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"],
	className = "",
}: ImageUploadProps) {
	const [uploading, setUploading] = useState(false);
	const [dragActive, setDragActive] = useState(false);
	const fileInputRef = useRef<HTMLInputElement>(null);
	const { toast } = useToast();

	const handleFileSelect = async (file: File) => {
		// Validate file type
		if (!acceptedFileTypes.includes(file.type)) {
			toast({
				variant: "destructive",
				title: "Invalid file type",
				description: `Please select a valid image file. Accepted types: ${acceptedFileTypes
					.map((type) => type.split("/")[1])
					.join(", ")}`,
			});
			return;
		}

		// Validate file size
		const maxSizeBytes = maxSizeMB * 1024 * 1024;
		if (file.size > maxSizeBytes) {
			toast({
				variant: "destructive",
				title: "File too large",
				description: `Please select a file smaller than ${maxSizeMB}MB`,
			});
			return;
		}

		try {
			setUploading(true);

			const formData = new FormData();
			formData.append("file", file);

			const response = await fetch(uploadEndpoint, {
				method: "POST",
				body: formData,
			});

			if (!response.ok) {
				const errorData = await response.json();
				throw new Error(errorData.error || "Upload failed");
			}

			const result = await response.json();

			if (result.data?.url) {
				onChange(result.data.url);
				toast({
					title: "Success",
					description: "Image uploaded successfully",
				});
			} else {
				throw new Error("No URL returned from upload");
			}
		} catch (error) {
			console.error("Upload error:", error);
			toast({
				variant: "destructive",
				title: "Upload failed",
				description:
					error instanceof Error ? error.message : "Failed to upload image",
			});
		} finally {
			setUploading(false);
		}
	};

	const handleDrop = (e: React.DragEvent) => {
		e.preventDefault();
		setDragActive(false);

		if (disabled || uploading) return;

		const files = Array.from(e.dataTransfer.files);
		if (files.length > 0) {
			handleFileSelect(files[0]);
		}
	};

	const handleDragOver = (e: React.DragEvent) => {
		e.preventDefault();
		if (!disabled && !uploading) {
			setDragActive(true);
		}
	};

	const handleDragLeave = (e: React.DragEvent) => {
		e.preventDefault();
		setDragActive(false);
	};

	const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const files = e.target.files;
		if (files && files.length > 0) {
			handleFileSelect(files[0]);
		}
		// Reset input value to allow uploading the same file again
		if (fileInputRef.current) {
			fileInputRef.current.value = "";
		}
	};

	const handleRemove = () => {
		if (onRemove) {
			onRemove();
		} else {
			onChange("");
		}
	};

	return (
		<div className={`space-y-2 ${className}`}>
			{label && (
				<Label className="text-sm font-medium">
					{label}
					{required && <span className="text-destructive ml-1">*</span>}
				</Label>
			)}
			{description && (
				<p className="text-sm text-muted-foreground">{description}</p>
			)}

			<div className="space-y-4">
				{/* Preview */}
				{value && (
					<div className="relative">
						<div className="relative aspect-video w-full max-w-xs rounded-lg overflow-hidden border">
							<img
								src={value}
								alt="Preview"
								className="w-full h-full object-cover"
								onError={(e) => {
									console.error("Failed to load image:", value);
									e.currentTarget.src = "/placeholder.svg";
								}}
							/>
						</div>
						{!disabled && (
							<Button
								type="button"
								variant="destructive"
								size="sm"
								className="absolute -top-2 -right-2 h-6 w-6 rounded-full p-0"
								onClick={handleRemove}
							>
								<X className="h-3 w-3" />
							</Button>
						)}
					</div>
				)}

				{/* Upload Area */}
				{!value && (
					<div
						className={`
							relative border-2 border-dashed rounded-lg p-6 transition-colors
							${dragActive ? "border-primary bg-primary/5" : "border-muted-foreground/25"}
							${
								disabled
									? "opacity-50 cursor-not-allowed"
									: "cursor-pointer hover:bg-muted/50"
							}
						`}
						onDrop={handleDrop}
						onDragOver={handleDragOver}
						onDragLeave={handleDragLeave}
						onClick={() =>
							!disabled && !uploading && fileInputRef.current?.click()
						}
					>
						<input
							ref={fileInputRef}
							type="file"
							accept={acceptedFileTypes.join(",")}
							onChange={handleFileInputChange}
							disabled={disabled || uploading}
							className="hidden"
						/>

						<div className="flex flex-col items-center justify-center space-y-2 text-center">
							{uploading ? (
								<>
									<Loader2 className="h-8 w-8 animate-spin text-primary" />
									<p className="text-sm text-muted-foreground">Uploading...</p>
								</>
							) : (
								<>
									<div className="rounded-full bg-muted p-3">
										{dragActive ? (
											<Upload className="h-6 w-6 text-primary" />
										) : (
											<ImageIcon className="h-6 w-6 text-muted-foreground" />
										)}
									</div>
									<div className="space-y-1">
										<p className="text-sm font-medium">
											{dragActive
												? "Drop image here"
												: "Click to upload or drag and drop"}
										</p>
										<p className="text-xs text-muted-foreground">
											{acceptedFileTypes
												.map((type) => type.split("/")[1].toUpperCase())
												.join(", ")}{" "}
											up to {maxSizeMB}MB
										</p>
									</div>
								</>
							)}
						</div>
					</div>
				)}

				{/* Upload Button (alternative to drag & drop) */}
				{!value && !uploading && (
					<Button
						type="button"
						variant="outline"
						onClick={() => fileInputRef.current?.click()}
						disabled={disabled}
						className="w-full"
					>
						<Upload className="h-4 w-4 mr-2" />
						Choose File
					</Button>
				)}
			</div>
		</div>
	);
}
