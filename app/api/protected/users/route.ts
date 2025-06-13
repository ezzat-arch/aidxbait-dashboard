import { type NextRequest, NextResponse } from "next/server";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { withPermission } from "@/lib/auth/api-auth";
import { Permission } from "@/types/permission-types";

// Example of a protected API route using the withPermission wrapper
export const GET = withPermission(
	[Permission.ViewUsers],
	async (req: NextRequest, context, user) => {
		const cookieStore = cookies();
		const supabase = createRouteHandlerClient({ cookies: () => cookieStore });

		// Get query parameters
		const { searchParams } = new URL(req.url);
		const page = Number.parseInt(searchParams.get("page") || "1");
		const limit = Number.parseInt(searchParams.get("limit") || "10");
		const search = searchParams.get("search") || "";
		const status = searchParams.get("status") || "";
		const roles = searchParams.get("roles")?.split(",") || [];

		// Calculate pagination
		const from = (page - 1) * limit;
		const to = from + limit - 1;

		// Build query
		let query = supabase.from("users").select("*", { count: "exact" });

		// Apply filters if provided
		if (search) {
			query = query.or(`name.ilike.%${search}%,email.ilike.%${search}%`);
		}

		if (status && status !== "all") {
			query = query.eq("status", status);
		}

		if (roles.length > 0) {
			query = query.in("role", roles);
		}

		// Apply pagination
		query = query.range(from, to);

		// Execute query
		const { data, error, count } = await query;

		if (error) {
			return NextResponse.json({ error: error.message }, { status: 500 });
		}

		return NextResponse.json({
			data,
			meta: {
				total: count || 0,
				page,
				limit,
				totalPages: count ? Math.ceil(count / limit) : 0,
			},
		});
	}
);

// Example of a protected POST endpoint with different permission requirement
export const POST = withPermission(
	[Permission.CreateUsers],
	async (req: NextRequest, context, user) => {
		const cookieStore = cookies();
		const supabase = createRouteHandlerClient({ cookies: () => cookieStore });

		try {
			const userData = await req.json();

			// Validate required fields
			if (
				!userData.name ||
				!userData.email ||
				!userData.role ||
				!userData.status
			) {
				return NextResponse.json(
					{ error: "Missing required fields" },
					{ status: 400 }
				);
			}

			// Insert new user
			const { data, error } = await supabase
				.from("users")
				.insert({
					name: userData.name,
					email: userData.email,
					role: userData.role,
					status: userData.status,
					last_active: new Date().toISOString(),
				})
				.select()
				.single();

			if (error) {
				return NextResponse.json({ error: error.message }, { status: 500 });
			}

			return NextResponse.json({ data }, { status: 201 });
		} catch (error) {
			return NextResponse.json(
				{ error: "Invalid request data" },
				{ status: 400 }
			);
		}
	}
);

// Example of a protected DELETE endpoint
export const DELETE = withPermission(
	[Permission.DeleteUsers],
	async (req: NextRequest, context, user) => {
		const cookieStore = cookies();
		const supabase = createRouteHandlerClient({ cookies: () => cookieStore });

		try {
			const { searchParams } = new URL(req.url);
			const id = searchParams.get("id");

			if (!id) {
				return NextResponse.json(
					{ error: "User ID is required" },
					{ status: 400 }
				);
			}

			const { error } = await supabase.from("users").delete().eq("id", id);

			if (error) {
				return NextResponse.json({ error: error.message }, { status: 500 });
			}

			return NextResponse.json({ success: true }, { status: 200 });
		} catch (error) {
			return NextResponse.json({ error: "Invalid request" }, { status: 400 });
		}
	}
);
