import Link from 'next/link';
import Image from 'next/image';

export function Header() {
  return (
    <header className="p-4 bg-background border-b border-border">
      <nav className="container mx-auto flex justify-between items-center">
        <Link href="/" className="flex items-center space-x-2">
          <Image src="/logo.png" alt="AIMap Logo" width={32} height={32} />
          <span className="font-bold text-lg">AIMap</span>
        </Link>
        <div className="space-x-4">
          <Link href="/login" className="text-sm hover:underline">Log In</Link>
          <Link href="/signup" className="text-sm hover:underline">Sign Up</Link>
        </div>
      </nav>
    </header>
  );
}
