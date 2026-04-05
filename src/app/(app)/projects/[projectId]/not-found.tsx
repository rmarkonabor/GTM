import Link from "next/link";

export default function ProjectNotFound() {
  return (
    <div className="p-8 max-w-xl">
      <h1 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Project Not Found</h1>
      <p className="text-slate-500 text-sm mb-4">This project doesn&apos;t exist or you don&apos;t have access to it.</p>
      <Link href="/dashboard" className="inline-flex items-center justify-center rounded-md bg-violet-600 hover:bg-violet-700 text-white text-sm font-medium px-4 py-2">
        Back to Dashboard
      </Link>
    </div>
  );
}
