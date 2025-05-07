import Link from 'next/link';
import { Button } from '@/components/ui/button'; // Assuming you have a Button component

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background text-foreground p-4">
      <div className="text-center">
        <h1 className="text-9xl font-bold text-primary">404</h1>
        <h2 className="mt-4 text-3xl font-semibold tracking-tight sm:text-4xl">
          Page Not Found
        </h2>
        <p className="mt-6 text-lg leading-7 text-muted-foreground">
          Oops! The page you&apos;re looking for doesn&apos;t seem to exist.
        </p>
        <div className="mt-10 flex items-center justify-center gap-x-6">
          <Button asChild className="bg-green-600 hover:bg-green-700 text-white">
            <Link href="/">
              Go back home
            </Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/contact"> {/* Or any other relevant link */}
                Contact support <span aria-hidden="true">&rarr;</span>
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
} 