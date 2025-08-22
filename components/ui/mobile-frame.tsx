"use client";

import { cn } from "@/lib/utils";

interface MobileFrameProps {
	children: React.ReactNode;
	className?: string;
}

/**
 * A mobile phone frame component that provides a realistic phone-like appearance
 * for previewing content as it would appear in a mobile app
 */
export function MobileFrame({ children, className }: MobileFrameProps) {
	return (
		<div className={cn("relative mx-auto", className)}>
			{/* Phone Frame */}
			<div className="relative w-[340px] h-[720px] bg-black rounded-[36px] p-[8px] shadow-2xl">
				{/* Screen Bezel */}
				<div className="relative w-full h-full bg-gray-900 rounded-[30px] p-[4px]">
					{/* Notch */}
					<div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-[120px] h-[24px] bg-black rounded-b-[12px] z-10"></div>

					{/* Status Bar Icons */}
					<div className="absolute top-[8px] left-[16px] right-[16px] h-[20px] flex justify-between items-center text-white text-xs z-10">
						<div className="text-white font-medium">10:29</div>
						<div className="flex items-center gap-1">
							{/* Signal bars */}
							<div className="flex gap-[1px]">
								<div className="w-[3px] h-[6px] bg-white rounded-[0.5px]"></div>
								<div className="w-[3px] h-[8px] bg-white rounded-[0.5px]"></div>
								<div className="w-[3px] h-[10px] bg-white rounded-[0.5px]"></div>
								<div className="w-[3px] h-[12px] bg-white rounded-[0.5px]"></div>
							</div>
							{/* WiFi icon */}
							<svg
								width="16"
								height="12"
								viewBox="0 0 16 12"
								fill="none"
								className="text-white"
							>
								<path
									d="M8 12C8.55 12 9 11.55 9 11C9 10.45 8.55 10 8 10C7.45 10 7 10.45 7 11C7 11.55 7.45 12 8 12ZM8 7C9.1 7 10 7.9 10 9H6C6 7.9 6.9 7 8 7ZM8 4C10.21 4 12 5.79 12 8H4C4 5.79 5.79 4 8 4ZM8 1C12.42 1 16 4.58 16 9H0C0 4.58 3.58 1 8 1Z"
									fill="currentColor"
								/>
							</svg>
							{/* Battery */}
							<div className="w-[24px] h-[12px] border border-white rounded-[2px] relative">
								<div className="w-[18px] h-[8px] bg-white rounded-[1px] absolute top-[1px] left-[1px]"></div>
								<div className="w-[2px] h-[6px] bg-white rounded-r-[1px] absolute top-[3px] -right-[2px]"></div>
							</div>
						</div>
					</div>

					{/* Screen Content */}
					<div className="w-full h-full bg-white rounded-[24px] overflow-hidden mt-[28px] relative">
						{children}
					</div>
				</div>
			</div>
		</div>
	);
}
