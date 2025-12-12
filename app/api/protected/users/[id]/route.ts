import { type NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { withPermission } from "@/lib/auth/api-auth";
import { Permission } from "@/types/permission-types";

// Admin client for auth operations (bypasses RLS)
function createAdminClient() {
	return createSupabaseClient(
		process.env.NEXT_PUBLIC_SUPABASE_URL!,
		process.env.SUPABASE_SERVICE_ROLE_KEY!,
		{
			auth: {
				autoRefreshToken: false,
				persistSession: false,
			},
		}
	);
}

// GET - Fetch a single user by ID with role-specific data
export const GET = withPermission(
	[Permission.ViewUsers],
	async (req: NextRequest, context) => {
		const supabase = await createClient();
		const { id } = await context.params;

		if (!id) {
			return NextResponse.json(
				{ error: "User ID is required" },
				{ status: 400 }
			);
		}

		// Fetch base user data
		const { data: user, error } = await supabase
			.from("users")
			.select("*")
			.eq("id", id)
			.eq("is_soft_deleted", false)
			.single();

		if (error) {
			if (error.code === "PGRST116") {
				return NextResponse.json({ error: "User not found" }, { status: 404 });
			}
			return NextResponse.json({ error: error.message }, { status: 500 });
		}

		// Build response with role-specific data
		const userDetails: Record<string, unknown> = { ...user };

		// Fetch role-specific data based on user_type
		switch (user.user_type) {
			case "patient": {
				const { data: patient } = await supabase
					.from("patients")
					.select("*")
					.eq("user_id", user.id)
					.single();

				userDetails.patient = patient || null;

				// Fetch patient addresses if patient exists
				if (patient) {
					const { data: addresses } = await supabase
						.from("patient_addresses")
						.select("*")
						.eq("patient_id", patient.id)
						.eq("is_deleted", false)
						.order("is_primary", { ascending: false });

					userDetails.patient_addresses = addresses || [];
				}
				break;
			}
			case "therapist": {
				const { data: therapist } = await supabase
					.from("therapists")
					.select("*")
					.eq("user_id", user.id)
					.single();

				userDetails.therapist = therapist || null;
				break;
			}
			case "consultant": {
				const { data: consultant } = await supabase
					.from("consultants")
					.select("*")
					.eq("user_id", user.id)
					.single();

				userDetails.consultant = consultant || null;
				break;
			}
			case "admin": {
				const { data: admin } = await supabase
					.from("admins")
					.select("*")
					.eq("user_id", user.id)
					.single();

				userDetails.admin = admin || null;
				break;
			}
			case "superuser": {
				const { data: superuser } = await supabase
					.from("superusers")
					.select("*")
					.eq("user_id", user.id)
					.single();

				userDetails.superuser = superuser || null;
				break;
			}
		}

		return NextResponse.json({ data: userDetails });
	}
);

// PUT - Update a user
export const PUT = withPermission(
	[Permission.UpdateUsers],
	async (req: NextRequest, context) => {
		const supabase = await createClient();
		const { id } = await context.params;

		if (!id) {
			return NextResponse.json(
				{ error: "User ID is required" },
				{ status: 400 }
			);
		}

		try {
			const body = await req.json();
			const { first_name, last_name, phone_number, email, user_type } = body;

			// Validate required fields
			if (!first_name || !last_name || !phone_number || !user_type) {
				return NextResponse.json(
					{ error: "Missing required fields" },
					{ status: 400 }
				);
			}

			// Validate user_type
			const validUserTypes = [
				"patient",
				"therapist",
				"consultant",
				"admin",
				"superuser",
			];
			if (!validUserTypes.includes(user_type)) {
				return NextResponse.json(
					{ error: "Invalid user type" },
					{ status: 400 }
				);
			}

			// Update user
			const { data, error } = await supabase
				.from("users")
				.update({
					first_name,
					last_name,
					phone_number,
					email: email || null,
					user_type,
					updated_at: new Date().toISOString(),
				})
				.eq("id", id)
				.eq("is_soft_deleted", false)
				.select()
				.single();

			if (error) {
				// Handle unique constraint violations
				if (error.code === "23505") {
					if (error.message.includes("email")) {
						return NextResponse.json(
							{ error: "Email already in use" },
							{ status: 409 }
						);
					}
					if (error.message.includes("phone")) {
						return NextResponse.json(
							{ error: "Phone number already in use" },
							{ status: 409 }
						);
					}
					return NextResponse.json(
						{ error: "Duplicate entry" },
						{ status: 409 }
					);
				}
				if (error.code === "PGRST116") {
					return NextResponse.json(
						{ error: "User not found" },
						{ status: 404 }
					);
				}
				return NextResponse.json({ error: error.message }, { status: 500 });
			}

			return NextResponse.json({ data });
		} catch {
			return NextResponse.json(
				{ error: "Invalid request data" },
				{ status: 400 }
			);
		}
	}
);

// DELETE - Soft delete user and remove from auth
export const DELETE = withPermission(
	[Permission.DeleteUsers],
	async (req: NextRequest, context) => {
		const supabase = await createClient();
		const supabaseAdmin = createAdminClient();
		const { id } = await context.params;

		if (!id) {
			return NextResponse.json(
				{ error: "User ID is required" },
				{ status: 400 }
			);
		}

		try {
			// First, fetch the user to get supabase_id
			const { data: user, error: fetchError } = await supabase
				.from("users")
				.select("id, supabase_id")
				.eq("id", id)
				.eq("is_soft_deleted", false)
				.single();

			if (fetchError) {
				if (fetchError.code === "PGRST116") {
					return NextResponse.json(
						{ error: "User not found" },
						{ status: 404 }
					);
				}
				return NextResponse.json(
					{ error: fetchError.message },
					{ status: 500 }
				);
			}

			// Soft delete from public.users
			const { error: softDeleteError } = await supabase
				.from("users")
				.update({
					is_soft_deleted: true,
					deleted_at: new Date().toISOString(),
					updated_at: new Date().toISOString(),
				})
				.eq("id", id);

			if (softDeleteError) {
				console.error("Soft delete error:", softDeleteError);
				return NextResponse.json(
					{ error: softDeleteError.message },
					{ status: 500 }
				);
			}

			// Hard delete from auth.users if supabase_id exists
			if (user.supabase_id) {
				const { error: authDeleteError } =
					await supabaseAdmin.auth.admin.deleteUser(user.supabase_id);

				if (authDeleteError) {
					// Log the error but don't fail the request since soft delete succeeded
					console.error("Auth delete error:", authDeleteError);
					// The soft delete succeeded, so we return success with a warning
					return NextResponse.json({
						success: true,
						warning: "User marked as deleted but auth record removal failed",
					});
				}
			}

			return NextResponse.json({ success: true });
		} catch (error) {
			console.error("Delete user error:", error);
			return NextResponse.json(
				{ error: "Failed to delete user" },
				{ status: 500 }
			);
		}
	}
);

