import { Suspense } from "react";
import Fuse from "fuse.js";
import { DateRange } from "@/types/analytics-types";
import { programsCollections } from "./programs-questions";
import { CollectionNavigator } from "../collection-navigator";
import { QuestionCard } from "../question-card";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Search } from "lucide-react";

interface ProgramsTabProps {
	dateRange: DateRange;
	searchQuery?: string;
	collectionId?: string;
}

const QuestionCardSkeleton = () => {
	return (
		<Card>
			<CardContent className="p-6">
				<Skeleton className="h-8 w-3/4 mb-4" />
				<Skeleton className="h-4 w-full mb-2" />
				<Skeleton className="h-4 w-2/3 mb-6" />
				<Skeleton className="h-64 w-full" />
			</CardContent>
		</Card>
	);
};

export function ProgramsTab({
	dateRange,
	searchQuery = "",
	collectionId,
}: ProgramsTabProps) {
	// Determine active collection
	const activeCollection =
		programsCollections.find((c) => c.id === collectionId) ||
		programsCollections[0];

	// Prepare collection metadata for navigator
	const collectionMetadata = programsCollections.map((c) => ({
		id: c.id,
		name: c.name,
	}));

	// Handle search mode
	const isSearchMode = searchQuery.trim().length > 0;

	let filteredCollections = programsCollections;
	if (isSearchMode) {
		// Flatten all questions for search
		const allQuestions = programsCollections.flatMap((collection) =>
			collection.questions.map((q) => ({
				...q,
				collectionId: collection.id,
			}))
		);

		// Perform fuzzy search
		const fuse = new Fuse(allQuestions, {
			keys: ["title"],
			threshold: 0.3,
		});

		const searchResults = fuse.search(searchQuery).map((r) => r.item);

		// Filter collections to only show those with matching questions
		filteredCollections = programsCollections
			.map((collection) => ({
				...collection,
				questions: collection.questions.filter((q) =>
					searchResults.some((r) => r.id === q.id)
				),
			}))
			.filter((collection) => collection.questions.length > 0);
	} else {
		// Normal mode: only show active collection
		filteredCollections = [activeCollection];
	}

	return (
		<div className="space-y-6">
			<CollectionNavigator
				collections={collectionMetadata}
				initialCollection={activeCollection.id}
				initialSearch={searchQuery}
			/>

			{/* Results */}
			{isSearchMode ? (
				// Search Mode: Show all matching questions grouped by collection
				<div className="space-y-8">
					{filteredCollections.length === 0 ? (
						<Card>
							<CardContent className="flex flex-col items-center justify-center p-12">
								<Search className="w-12 h-12 text-muted-foreground mb-4" />
								<h3 className="text-xl font-semibold mb-2">No results found</h3>
								<p className="text-muted-foreground text-center">
									Try adjusting your search query or clear the search to browse
									all questions.
								</p>
							</CardContent>
						</Card>
					) : (
						filteredCollections.map((collection) => (
							<div key={collection.id} className="space-y-4">
								<div>
									<h3 className="text-lg font-semibold">{collection.name}</h3>
									{collection.description && (
										<p className="text-sm text-muted-foreground">
											{collection.description}
										</p>
									)}
								</div>
								<div className="grid gap-6 md:grid-cols-2">
									{collection.questions.map((question) => (
										<Suspense
											key={question.id}
											fallback={<QuestionCardSkeleton />}
										>
											<QuestionCard question={question} dateRange={dateRange} />
										</Suspense>
									))}
								</div>
							</div>
						))
					)}
				</div>
			) : (
				// Normal Mode: Show selected collection
				<div className="space-y-4">
					{activeCollection.description && (
						<p className="text-muted-foreground">
							{activeCollection.description}
						</p>
					)}
					<div className="grid gap-6 md:grid-cols-2">
						{activeCollection.questions.map((question) => (
							<Suspense key={question.id} fallback={<QuestionCardSkeleton />}>
								<QuestionCard question={question} dateRange={dateRange} />
							</Suspense>
						))}
					</div>
				</div>
			)}
		</div>
	);
}
