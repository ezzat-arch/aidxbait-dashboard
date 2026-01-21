// Exercise Program entity types based on the database schema

// Hardcoded video categories with English and Arabic translations
export const VIDEO_CATEGORIES = [
	{ en: "Hand", ar: "اليد" },
	{ en: "Spine - CS", ar: "العمود الفقري - CS" },
	{ en: "Elbow", ar: "الكوع" },
	{ en: "Spine - DLS All 4s arching", ar: "العمود الفقري - DLS All 4s arching" },
	{ en: "Knee", ar: "الركبة" },
	{ en: "Wrist", ar: "الرسغ" },
	{ en: "Spine - LSS", ar: "العمود الفقري - LSS" },
	{ en: "Shoulder", ar: "الكتف" },
	{ en: "Complex & Poses & Stances", ar: "حركات معقدة ووضعيات" },
	{ en: "Ankle & Foot", ar: "الكاحل والقدم" },
	{ en: "Hip", ar: "الورك" },
	{ en: "Abs", ar: "البطن" },
] as const;

export type VideoCategory = (typeof VIDEO_CATEGORIES)[number];

// Program joint names - separate from product joint names
export interface ProgramJointName {
	id: number;
	name: string;
	name_ar: string;
}

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
	thumbnail_url?: string; // Optional when THUMBNAIL_REQUIRED is false
	price: number;
	soft_deleted: boolean;
	created_at: string;
	updated_at: string;
}

// Volume type for exercises - matches the database enum exercise_volume_type
// - reps: sets × reps (e.g., 3 sets of 10 reps)
// - hold: sets × hold_seconds (e.g., 3 sets of 30s hold)
// - reps_with_hold: sets × reps with hold per rep (e.g., 3 sets of 10 reps, 2s hold each)
export type VolumeType = "reps" | "hold" | "reps_with_hold";

// New program_exercises table structure
export interface ProgramExercise {
	id: number;
	program_id: number;
	video_id: number;
	start_week: number;
	end_week: number;
	display_order: number | null;
	// Volume type determines which fields are used
	volume_type: VolumeType;
	// Volume fields (usage depends on volume_type)
	// - reps: sets + reps (hold_seconds = null)
	// - hold: sets + hold_seconds (reps = null)
	// - reps_with_hold: sets + reps + hold_seconds
	sets: number | null;
	reps: number | null;
	hold_seconds: number | null;
	notes: string | null;
	notes_ar: string | null;
	created_at: string;
	updated_at: string;
}

// Exercise with video details for UI display
export interface ExerciseWithVideo extends ProgramExercise {
	video: Video;
}

// Extended types for UI components
export interface ProgramWithExercises extends Program {
	exercises: ExerciseWithVideo[];
	exercise_count?: number;
	total_duration?: number; // in seconds
	joints?: ProgramJointName;
}

// Week group for displaying exercises grouped by week ranges
export interface WeekGroup {
	startWeek: number;
	endWeek: number;
	label: string;
	exercises: ExerciseWithVideo[];
}

// @deprecated - Use ProgramExercise instead
export interface ProgramVideo {
	id: number;
	program_id: number;
	video_id: number;
	sort_order: number;
	created_at: string;
	updated_at: string;
}

// @deprecated - Use ProgramWithExercises instead
export interface ProgramWithVideos extends Program {
	videos: VideoWithProgramDetails[];
	video_count?: number;
	total_duration?: number; // in seconds
	joints?: ProgramJointName;
}

// @deprecated - Use ExerciseWithVideo instead
export interface VideoWithProgramDetails extends Video {
	sort_order?: number;
	program_id?: number;
}

// Form types for creating/editing
export interface CreateProgramJointNameData {
	name: string;
	name_ar: string;
}

export interface UpdateProgramJointNameData
	extends Partial<CreateProgramJointNameData> {
	id: number;
}

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
			| "title"
			| "title_ar"
			| "description"
			| "description_ar"
			| "duration"
			| "category"
			| "category_ar"
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
	thumbnail_url?: string; // Optional when THUMBNAIL_REQUIRED is false
	price: number;
}

export interface UpdateProgramData extends Partial<CreateProgramData> {
	id: number;
}

// Form data for creating a new exercise assignment
export interface CreateProgramExerciseData {
	video_id: number;
	start_week: number;
	end_week: number;
	display_order?: number;
	// Volume - one of these patterns must be provided
	volume_type: VolumeType;
	sets?: number;
	reps?: number;
	hold_seconds?: number;
	notes?: string;
	notes_ar?: string;
}

// Form data for updating an exercise assignment
export interface UpdateProgramExerciseData {
	start_week?: number;
	end_week?: number;
	display_order?: number;
	volume_type?: VolumeType;
	sets?: number | null;
	reps?: number | null;
	hold_seconds?: number | null;
	notes?: string | null;
	notes_ar?: string | null;
}

// Batch update for reordering exercises
export interface UpdateExerciseOrderData {
	exercise_orders: {
		exercise_id: number;
		display_order: number;
	}[];
}

// @deprecated - Use CreateProgramExerciseData instead
export interface AddVideoToProgramData {
	program_id: number;
	video_id: number;
	sort_order?: number;
}

// @deprecated - Use UpdateExerciseOrderData instead
export interface UpdateProgramVideoOrderData {
	program_id: number;
	video_orders: {
		video_id: number;
		sort_order: number;
	}[];
}

// ============================================
// Change Tracking Types (for batch save modal)
// ============================================

// Temporary ID for new exercises (to distinguish from DB IDs)
export type TempExerciseId = `temp-${string}`;

// Check if an ID is a temporary ID
export const isTempId = (id: number | TempExerciseId): id is TempExerciseId => {
	return typeof id === "string" && id.startsWith("temp-");
};

// Generate a new temporary ID
export const generateTempId = (): TempExerciseId => {
	return `temp-${crypto.randomUUID()}`;
};

// Exercise pending creation (no DB id yet)
export interface PendingExercise
	extends Omit<ExerciseWithVideo, "id" | "created_at" | "updated_at"> {
	tempId: TempExerciseId;
}

// Type guard to check if exercise is pending (not yet in DB)
export const isPendingExercise = (
	exercise: ExerciseWithVideo | PendingExercise
): exercise is PendingExercise => {
	return "tempId" in exercise;
};

// Get the identifier for an exercise (either id or tempId)
export const getExerciseIdentifier = (
	exercise: ExerciseWithVideo | PendingExercise
): number | TempExerciseId => {
	return isPendingExercise(exercise) ? exercise.tempId : exercise.id;
};

// Local exercise type that can be either existing or pending
export type LocalExercise = ExerciseWithVideo | PendingExercise;

// Track all pending changes for bulk save
export interface ExerciseChanges {
	added: PendingExercise[];
	modified: Map<number, UpdateProgramExerciseData>;
	deleted: Set<number>;
}

// Check if there are any unsaved changes
export const hasUnsavedChanges = (changes: ExerciseChanges): boolean => {
	return (
		changes.added.length > 0 ||
		changes.modified.size > 0 ||
		changes.deleted.size > 0
	);
};

// Create empty changes object
export const createEmptyChanges = (): ExerciseChanges => ({
	added: [],
	modified: new Map(),
	deleted: new Set(),
});

// Bulk sync request payload for API
export interface BulkSyncExercisesPayload {
	create: CreateProgramExerciseData[];
	update: { id: number; data: UpdateProgramExerciseData }[];
	delete: number[];
}

// Bulk sync response from API
export interface BulkSyncExercisesResponse {
	created: ExerciseWithVideo[];
	updated: number;
	deleted: number;
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

// Format exercise volume for display based on volume_type
// - reps: "3x10" (sets × reps)
// - hold: "3x30s" (sets × hold duration)
// - reps_with_hold: "3x10 (2s hold)" (sets × reps with hold per rep)
export const formatVolume = (exercise: ProgramExercise): string => {
	const { volume_type, sets, reps, hold_seconds } = exercise;

	// Use explicit volume_type if available
	if (volume_type) {
		switch (volume_type) {
			case "reps":
				if (sets !== null && reps !== null) {
					return `${sets}x${reps}`;
				}
				break;
			case "hold":
				if (sets !== null && hold_seconds !== null) {
					return `${sets}x${hold_seconds}s`;
				}
				break;
			case "reps_with_hold":
				if (sets !== null && reps !== null && hold_seconds !== null) {
					return `${sets}x${reps} (${hold_seconds}s hold)`;
				}
				break;
		}
	}

	// Fallback for legacy data without volume_type (infer from fields)
	if (sets !== null && reps !== null && hold_seconds !== null) {
		return `${sets}x${reps} (${hold_seconds}s hold)`;
	} else if (sets !== null && reps !== null) {
		return `${sets}x${reps}`;
	} else if (sets !== null && hold_seconds !== null) {
		return `${sets}x${hold_seconds}s`;
	} else if (hold_seconds !== null) {
		return `${hold_seconds}s hold`;
	}

	return "-";
};

// Get the volume type from an exercise
// Uses the explicit volume_type field, with fallback inference for legacy data
export const getVolumeType = (exercise: ProgramExercise): VolumeType => {
	// Prefer explicit volume_type if set
	if (exercise.volume_type) {
		return exercise.volume_type;
	}

	// Fallback: infer from fields for legacy data
	const { sets, reps, hold_seconds } = exercise;

	if (sets !== null && reps !== null && hold_seconds !== null) {
		return "reps_with_hold";
	} else if (sets !== null && reps !== null) {
		return "reps";
	}
	return "hold";
};

// Format week range for display (e.g., "Week 1-2" or "Week 3")
export const formatWeekRange = (startWeek: number, endWeek: number): string => {
	if (startWeek === endWeek) {
		return `Week ${startWeek}`;
	}
	return `Week ${startWeek}-${endWeek}`;
};

// Group exercises by their week ranges
export const groupExercisesByWeeks = (
	exercises: ExerciseWithVideo[]
): WeekGroup[] => {
	const groupMap = new Map<string, ExerciseWithVideo[]>();

	exercises.forEach((exercise) => {
		const key = `${exercise.start_week}-${exercise.end_week}`;
		if (!groupMap.has(key)) {
			groupMap.set(key, []);
		}
		groupMap.get(key)!.push(exercise);
	});

	// Convert map to array and sort by start_week
	const groups: WeekGroup[] = Array.from(groupMap.entries())
		.map(([key, exercises]) => {
			const [startWeek, endWeek] = key.split("-").map(Number);
			return {
				startWeek,
				endWeek,
				label: formatWeekRange(startWeek, endWeek),
				exercises: exercises.sort(
					(a, b) => (a.display_order || 0) - (b.display_order || 0)
				),
			};
		})
		.sort((a, b) => a.startWeek - b.startWeek);

	return groups;
};

// Week group for local exercises (including pending ones)
export interface LocalWeekGroup {
	startWeek: number;
	endWeek: number;
	label: string;
	exercises: LocalExercise[];
}

// Group local exercises by their week ranges (supports both existing and pending)
export const groupLocalExercisesByWeeks = (
	exercises: LocalExercise[]
): LocalWeekGroup[] => {
	const groupMap = new Map<string, LocalExercise[]>();

	exercises.forEach((exercise) => {
		const key = `${exercise.start_week}-${exercise.end_week}`;
		if (!groupMap.has(key)) {
			groupMap.set(key, []);
		}
		groupMap.get(key)!.push(exercise);
	});

	// Convert map to array and sort by start_week
	const groups: LocalWeekGroup[] = Array.from(groupMap.entries())
		.map(([key, exercises]) => {
			const [startWeek, endWeek] = key.split("-").map(Number);
			return {
				startWeek,
				endWeek,
				label: formatWeekRange(startWeek, endWeek),
				exercises: exercises.sort(
					(a, b) => (a.display_order || 0) - (b.display_order || 0)
				),
			};
		})
		.sort((a, b) => a.startWeek - b.startWeek);

	return groups;
};
