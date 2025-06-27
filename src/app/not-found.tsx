"use client";

import Lottie from "lottie-react";
import Link from "next/link";
import animationData from "../../public/animations/404.json";

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-[300px] h-[300px] mb-6">
        <Lottie animationData={animationData} loop={true} />
      </div>
      <h1 className="text-4xl font-bold mb-3">Page Not Found</h1>
      <p className="text-gray-600 dark:text-gray-400 mb-6 text-center">
        The page you are looking for does not exist or has been moved.
      </p>
      <Link
        href="/"
        className="px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
      >
        Return Home
      </Link>
    </div>
  );
} 