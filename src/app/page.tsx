import Link from "next/link";

export default function Home() {
  return (
    <main className="flex min-h-screen items-center justify-center">
      <nav className="flex flex-col gap-2 text-sm">
        <p className="text-neutral-400 text-xs uppercase tracking-widest mb-4">design system</p>
        <Link href="/palette" className="hover:underline">Color Palette Generator</Link>
      </nav>
    </main>
  );
}
