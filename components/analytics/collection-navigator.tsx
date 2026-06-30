"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Search, X } from "lucide-react";

interface CollectionNavigatorProps {
	collections: Array<{ id: string; name: string }>;
	initialCollection: string;
	initialSearch: string;
}

export function CollectionNavigator({
	collections,
	initialCollection,
	initialSearch,
}: CollectionNavigatorProps) {
	const router = useRouter();
	const searchParams = useSearchParams();

	const [activeCollection, setActiveCollection] = useState(initialCollection);
	const [searchQuery, setSearchQuery] = useState(initialSearch);

	// Sync state with URL on mount/change
	useEffect(() => {
		const urlCol = searchParams.get("collection");
		const urlQ = searchParams.get("q") || "";

		if (urlCol && collections.find((c) => c.id === urlCol)) {
			setActiveCollection(urlCol);
		}
		setSearchQuery(urlQ);
	}, [searchParams, collections]);

	// Update URL when collection changes
	const handleCollectionChange = (collectionId: string) => {
		setActiveCollection(collectionId);
		const params = new URLSearchParams(window.location.search);
		params.set("collection", collectionId);
		// Clear search when changing collections
		params.delete("q");
		router.push(`?${params.toString()}`);
	};

	// Update URL when search changes
	const handleSearchChange = (value: string) => {
		setSearchQuery(value);
		const params = new URLSearchParams(window.location.search);

		if (value.trim()) {
			params.set("q", value);
		} else {
			params.delete("q");
		}

		router.push(`?${params.toString()}`);
	};

	// Clear search
	const handleClearSearch = () => {
		handleSearchChange("");
	};

	// Determine grid columns class based on number of collections
	const getGridColsClass = (count: number) => {
		if (count <= 2) return "sm:grid-cols-2";
		if (count <= 3) return "sm:grid-cols-3";
		if (count <= 4) return "sm:grid-cols-4";
		return "sm:grid-cols-5";
	};

	const isSearchMode = searchQuery.trim().length > 0;

	return (
		<div className="space-y-6">
			{/* Search Bar */}
			<div className="relative">
				<Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
				<Input
					type="text"
					placeholder="Search questions by title..."
					value={searchQuery}
					onChange={(e) => handleSearchChange(e.target.value)}
					className="pl-10 pr-10"
				/>
				{searchQuery && (
					<button
						onClick={handleClearSearch}
						className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
						aria-label="Clear search"
					>
						<X className="w-4 h-4" />
					</button>
				)}
			</div>

			{/* Collection Tabs - Only show when not searching */}
			{!isSearchMode && (
				<Tabs
					value={activeCollection}
					onValueChange={handleCollectionChange}
					className="w-full"
				>
					<div className="overflow-x-auto">
						<TabsList
							className={`flex w-max sm:grid sm:w-full ${getGridColsClass(
								collections.length
							)} h-auto lg:w-fit`}
						>
							{collections.map((collection) => (
								<TabsTrigger
									key={collection.id}
									value={collection.id}
									className="shrink-0 whitespace-nowrap"
								>
									{collection.name}
								</TabsTrigger>
							))}
						</TabsList>
					</div>
				</Tabs>
			)}
		</div>
	);
}
