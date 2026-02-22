import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { withPermission } from "@/lib/auth/api-auth";
import { Permission } from "@/types/permission-types";

const handleGetJoint = withPermission(
	[Permission.ViewStore],
	async (req, context, user) => {
		try {
			const { id } = await context.params;
			const jointId = parseInt(id);

			if (isNaN(jointId)) {
				return NextResponse.json(
					{ error: "Invalid joint ID" },
					{ status: 400 }
				);
			}

			const supabase = await createClient();

			// Fetch product joint name
			const { data: joint, error } = await supabase
				.from("product_joint_names")
				.select("*")
				.eq("id", jointId)
				.single();

			if (error) {
				console.error("Database error:", error);
				return NextResponse.json({ error: "Joint not found" }, { status: 404 });
			}

			return NextResponse.json({ data: joint });
		} catch (error) {
			console.error("Unexpected error:", error);
			return NextResponse.json(
				{ error: "Internal server error" },
				{ status: 500 }
			);
		}
	}
);

const handleUpdateJoint = withPermission(
	[Permission.UpdateStoreItems],
	async (req, context, user) => {
		try {
			const { id } = await context.params;
			const jointId = parseInt(id);

			if (isNaN(jointId)) {
				return NextResponse.json(
					{ error: "Invalid joint ID" },
					{ status: 400 }
				);
			}

			const supabase = await createClient();
			const body = await req.json();

			// Validate required fields
			if (!body.name || typeof body.name !== "string") {
				return NextResponse.json(
					{ error: "Name is required and must be a string" },
					{ status: 400 }
				);
			}

			if (!body.name_ar || typeof body.name_ar !== "string") {
				return NextResponse.json(
					{ error: "Arabic name is required and must be a string" },
					{ status: 400 }
				);
			}

			// Update product joint name
			const { data: joint, error } = await supabase
				.from("product_joint_names")
				.update({
					name: body.name.trim(),
					name_ar: body.name_ar.trim(),
				})
				.eq("id", jointId)
				.select()
				.single();

			if (error) {
				console.error("Database error:", error);

				// Handle unique constraint violations
				if (error.code === "23505") {
					return NextResponse.json(
						{ error: "A joint with this name already exists" },
						{ status: 409 }
					);
				}

				return NextResponse.json(
					{ error: "Failed to update joint" },
					{ status: 500 }
				);
			}

			return NextResponse.json({
				data: joint,
				message: "Joint updated successfully",
			});
		} catch (error) {
			console.error("Unexpected error:", error);
			return NextResponse.json(
				{ error: "Internal server error" },
				{ status: 500 }
			);
		}
	}
);

const handleDeleteJoint = withPermission(
	[Permission.DeleteStoreItems],
	async (req, context, user) => {
		try {
			const { id } = await context.params;
			const jointId = parseInt(id);

			if (isNaN(jointId)) {
				return NextResponse.json(
					{ error: "Invalid joint ID" },
					{ status: 400 }
				);
			}

			const supabase = await createClient();

			// Check if joint is used by products
			const { data: productJoints, error: jointsError } = await supabase
				.from("product_joints")
				.select("product_id")
				.eq("joint_id", jointId);

			if (jointsError) {
				console.error("Database error checking product joints:", jointsError);
				return NextResponse.json(
					{ error: "Failed to check joint usage" },
					{ status: 500 }
				);
			}

			if (productJoints && productJoints.length > 0) {
				return NextResponse.json(
					{ error: "Cannot delete joint that is linked to products" },
					{ status: 400 }
				);
			}

			// Delete product joint name
			const { error } = await supabase
				.from("product_joint_names")
				.delete()
				.eq("id", jointId);

			if (error) {
				console.error("Database error:", error);
				return NextResponse.json(
					{ error: "Failed to delete joint" },
					{ status: 500 }
				);
			}

			return NextResponse.json({
				message: "Joint deleted successfully",
			});
		} catch (error) {
			console.error("Unexpected error:", error);
			return NextResponse.json(
				{ error: "Internal server error" },
				{ status: 500 }
			);
		}
	}
);

export const GET = handleGetJoint;
export const PUT = handleUpdateJoint;
export const DELETE = handleDeleteJoint;
