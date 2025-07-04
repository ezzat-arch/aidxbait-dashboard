"use client";

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { VideosTab } from "@/components/exercise-programs/videos-tab";
import { ProgramsTab } from "@/components/exercise-programs/programs-tab";

export function ExerciseProgramsDashboard() {
	const [activeTab, setActiveTab] = useState("programs");

	return (
		<div className="flex flex-col space-y-6">
			<Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
				<TabsList className="grid w-full grid-cols-2">
					<TabsTrigger value="programs">Exercise Programs</TabsTrigger>
					<TabsTrigger value="videos">Videos</TabsTrigger>
				</TabsList>

				<TabsContent value="programs" className="space-y-4">
					<ProgramsTab />
				</TabsContent>

				<TabsContent value="videos" className="space-y-4">
					<VideosTab />
				</TabsContent>
			</Tabs>
		</div>
	);
}
