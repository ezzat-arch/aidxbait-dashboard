// Exercise Program entity types based on the database schema

export interface Video {
	id: number;
	code: string;
	title: string;
	title_ar: string;
	category: string;
	category_ar: string;
	description?: string;
	description_ar?: string;
	s3_key: string;
	duration: number; // in seconds
	size_mb: number;
	soft_deleted: boolean;
	created_at: string;
	updated_at: string;
}

export interface Program {
	id: number;
	title: string;
	title_ar: string;
	description?: string;
	description_ar?: string;
	joint_id: number;
	price: number;
	soft_deleted: boolean;
	created_at: string;
	updated_at: string;
}

export interface ProgramVideo {
	id: number;
	program_id: number;
	video_id: number;
	sort_order: number;
	created_at: string;
	updated_at: string;
}

// Extended types for UI components
export interface ProgramWithVideos extends Program {
	videos: VideoWithProgramDetails[];
	video_count?: number;
	total_duration?: number; // in seconds
	joints?: {
		id: number;
		name: string;
	};
}

export interface VideoWithProgramDetails extends Video {
	sort_order?: number;
	program_id?: number;
}

// Form types for creating/editing
export interface CreateVideoData {
	code: string;
	title: string;
	title_ar: string;
	category: string;
	category_ar: string;
	description?: string;
	description_ar?: string;
	s3_key: string;
	duration: number; // in seconds
	size_mb: number;
}

export interface UpdateVideoData
	extends Partial<
		Pick<
			CreateVideoData,
			"title" | "title_ar" | "description" | "description_ar" | "duration"
		>
	> {
	id: number;
}

export interface CreateProgramData {
	title: string;
	title_ar: string;
	description?: string;
	description_ar?: string;
	joint_id: number;
	price: number;
}

export interface UpdateProgramData extends Partial<CreateProgramData> {
	id: number;
}

export interface AddVideoToProgramData {
	program_id: number;
	video_id: number;
	sort_order?: number;
}

export interface UpdateProgramVideoOrderData {
	program_id: number;
	video_orders: {
		video_id: number;
		sort_order: number;
	}[];
}

// Helper types for form inputs
export interface DurationInput {
	hours: number;
	minutes: number;
	seconds: number;
}

// API response types
export interface ExerciseProgramApiResponse<T> {
	data: T;
	meta?: {
		total: number;
		page?: number;
		limit?: number;
		totalPages?: number;
	};
}

export interface ExerciseProgramError {
	message: string;
	field?: string;
}

// Utility functions for duration conversion
export const durationInputToSeconds = (input: DurationInput): number => {
	return input.hours * 3600 + input.minutes * 60 + input.seconds;
};

export const secondsToDurationInput = (seconds: number): DurationInput => {
	const hours = Math.floor(seconds / 3600);
	const minutes = Math.floor((seconds % 3600) / 60);
	const remainingSeconds = seconds % 60;

	return {
		hours,
		minutes,
		seconds: remainingSeconds,
	};
};

export const formatDuration = (seconds: number): string => {
	const { hours, minutes, seconds: secs } = secondsToDurationInput(seconds);

	if (hours > 0) {
		return `${hours}h ${minutes}m ${secs}s`;
	} else if (minutes > 0) {
		return `${minutes}m ${secs}s`;
	} else {
		return `${secs}s`;
	}
};
