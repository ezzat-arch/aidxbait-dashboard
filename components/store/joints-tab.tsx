"use client";

import { useState, useEffect } from "react";
import { Plus, MoreHorizontal, Edit, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/components/ui/use-toast";
import { PermissionGate } from "@/components/rbac/permission-gate";
import { Permission } from "@/types/permission-types";
import { JointFormDialog } from "@/components/store/joint-form-dialog";
import { DeleteConfirmDialog } from "@/components/store/delete-confirm-dialog";
import type { Joint } from "@/types/store-types";

export function JointsTab() {
	const [joints, setJoints] = useState<Joint[]>([]);
	const [loading, setLoading] = useState(true);
	const [selectedJoint, setSelectedJoint] = useState<Joint | null>(null);
	const [showCreateDialog, setShowCreateDialog] = useState(false);
	const [showEditDialog, setShowEditDialog] = useState(false);
	const [showDeleteDialog, setShowDeleteDialog] = useState(false);
	const { toast } = useToast();

	useEffect(() => {
		fetchJoints();
	}, []);

	const fetchJoints = async () => {
		try {
			setLoading(true);
			const response = await fetch("/api/protected/store/joints");
			if (!response.ok) throw new Error("Failed to fetch joints");
			const result = await response.json();
			setJoints(result.data);
		} catch (error) {
			toast({
				variant: "destructive",
				title: "Error",
				description: "Failed to load joints",
			});
		} finally {
			setLoading(false);
		}
	};

	const handleCreateJoint = async (data: { name: string }) => {
		try {
			const response = await fetch("/api/protected/store/joints", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(data),
			});

			if (!response.ok) throw new Error("Failed to create joint");

			toast({
				title: "Success",
				description: "Joint created successfully",
			});

			setShowCreateDialog(false);
			fetchJoints();
		} catch (error) {
			toast({
				variant: "destructive",
				title: "Error",
				description: "Failed to create joint",
			});
		}
	};

	const handleEditJoint = async (data: { name: string }) => {
		if (!selectedJoint) return;

		try {
			const response = await fetch(
				`/api/protected/store/joints/${selectedJoint.id}`,
				{
					method: "PUT",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify(data),
				}
			);

			if (!response.ok) throw new Error("Failed to update joint");

			toast({
				title: "Success",
				description: "Joint updated successfully",
			});

			setShowEditDialog(false);
			setSelectedJoint(null);
			fetchJoints();
		} catch (error) {
			toast({
				variant: "destructive",
				title: "Error",
				description: "Failed to update joint",
			});
		}
	};

	const handleDeleteJoint = async () => {
		if (!selectedJoint) return;

		try {
			const response = await fetch(
				`/api/protected/store/joints/${selectedJoint.id}`,
				{
					method: "DELETE",
				}
			);

			if (!response.ok) throw new Error("Failed to delete joint");

			toast({
				title: "Success",
				description: "Joint deleted successfully",
			});

			setShowDeleteDialog(false);
			setSelectedJoint(null);
			fetchJoints();
		} catch (error) {
			toast({
				variant: "destructive",
				title: "Error",
				description: "Failed to delete joint",
			});
		}
	};

	return (
		<Card>
			<CardHeader className="flex flex-row items-center justify-between">
				<div>
					<CardTitle>Body Joints</CardTitle>
					<CardDescription>
						Manage body parts/joints that products can be linked to
					</CardDescription>
				</div>
				<PermissionGate permissions={[Permission.CreateStoreItems]}>
					<Button onClick={() => setShowCreateDialog(true)}>
						<Plus className="h-4 w-4 mr-2" />
						Add Joint
					</Button>
				</PermissionGate>
			</CardHeader>

			<CardContent>
				<Table>
					<TableHeader>
						<TableRow>
							<TableHead>Name</TableHead>
							<TableHead className="w-[50px]"></TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{loading ? (
							Array.from({ length: 5 }).map((_, index) => (
								<TableRow key={`loading-${index}`}>
									<TableCell>
										<div className="h-4 w-24 bg-muted animate-pulse rounded"></div>
									</TableCell>
									<TableCell>
										<div className="h-8 w-8 bg-muted animate-pulse rounded"></div>
									</TableCell>
								</TableRow>
							))
						) : joints.length > 0 ? (
							joints.map((joint) => (
								<TableRow key={joint.id}>
									<TableCell className="font-medium">{joint.name}</TableCell>
									<TableCell>
										<PermissionGate
											permissions={[
												Permission.UpdateStoreItems,
												Permission.DeleteStoreItems,
											]}
										>
											<DropdownMenu>
												<DropdownMenuTrigger asChild>
													<Button variant="ghost" size="icon">
														<MoreHorizontal className="h-4 w-4" />
													</Button>
												</DropdownMenuTrigger>
												<DropdownMenuContent align="end">
													<PermissionGate
														permissions={[Permission.UpdateStoreItems]}
													>
														<DropdownMenuItem
															onClick={() => {
																setSelectedJoint(joint);
																setShowEditDialog(true);
															}}
														>
															<Edit className="h-4 w-4 mr-2" />
															Edit
														</DropdownMenuItem>
													</PermissionGate>
													<PermissionGate
														permissions={[Permission.DeleteStoreItems]}
													>
														<DropdownMenuItem
															onClick={() => {
																setSelectedJoint(joint);
																setShowDeleteDialog(true);
															}}
															className="text-destructive"
														>
															<Trash2 className="h-4 w-4 mr-2" />
															Delete
														</DropdownMenuItem>
													</PermissionGate>
												</DropdownMenuContent>
											</DropdownMenu>
										</PermissionGate>
									</TableCell>
								</TableRow>
							))
						) : (
							<TableRow>
								<TableCell
									colSpan={2}
									className="text-center py-8 text-muted-foreground"
								>
									No joints found. Add body joints that products can be linked
									to.
								</TableCell>
							</TableRow>
						)}
					</TableBody>
				</Table>
			</CardContent>

			{/* Create Joint Dialog */}
			<JointFormDialog
				open={showCreateDialog}
				onOpenChange={setShowCreateDialog}
				onSubmit={handleCreateJoint}
				title="Create Joint"
				description="Add a new body joint/part for product categorization"
			/>

			{/* Edit Joint Dialog */}
			{selectedJoint && (
				<JointFormDialog
					open={showEditDialog}
					onOpenChange={setShowEditDialog}
					onSubmit={handleEditJoint}
					title="Edit Joint"
					description="Update joint information"
					defaultValues={{
						name: selectedJoint.name,
					}}
				/>
			)}

			{/* Delete Confirmation Dialog */}
			<DeleteConfirmDialog
				open={showDeleteDialog}
				onOpenChange={setShowDeleteDialog}
				onConfirm={handleDeleteJoint}
				title="Delete Joint"
				description={`Are you sure you want to delete "${selectedJoint?.name}"? This action cannot be undone.`}
			/>
		</Card>
	);
}
