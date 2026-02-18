"use client";

import React from "react";

export default function Loading() {
    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-green-50 flex items-center justify-center">
            <div className="flex flex-col items-center gap-4">
                <div className="w-12 h-12 border-4 border-green-200 border-t-green-600 rounded-full animate-spin" />
                <p className="text-gray-500 text-sm font-medium">Loading...</p>
            </div>
        </div>
    );
}
