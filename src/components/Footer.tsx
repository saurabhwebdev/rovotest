import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="border-t border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
      <div className="container mx-auto px-4 py-4">
        <div className="flex flex-col md:flex-row items-center justify-between">
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-2 md:mb-0">
            © {new Date().getFullYear()} LPMS. All rights reserved.
          </p>
          <div className="flex space-x-6">
            <Link href="/privacy" className="text-sm text-gray-500 hover:text-indigo-600 dark:text-gray-400 dark:hover:text-indigo-400">
              Privacy
            </Link>
            <Link href="/terms" className="text-sm text-gray-500 hover:text-indigo-600 dark:text-gray-400 dark:hover:text-indigo-400">
              Terms
            </Link>
            <Link href="/contact" className="text-sm text-gray-500 hover:text-indigo-600 dark:text-gray-400 dark:hover:text-indigo-400">
              Contact
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}