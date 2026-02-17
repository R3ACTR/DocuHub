
import Link from "next/link";

export function Footer() {
    return (
        <footer className="py-8 border-t border-border mt-auto bg-background">
            <div className="container mx-auto px-6 flex flex-col md:flex-row items-center justify-between text-sm text-muted-foreground">
                <p>&copy; {new Date().getFullYear()} DocuHub</p>
                <div className="flex gap-4 mt-4 md:mt-0">
                    <span>Local-first processing. Your data stays yours.</span>
                </div>
                <div className="flex gap-4 mt-4 md:mt-0">
                    <Link href="#" className="hover:text-foreground">Privacy</Link>
                    <Link href="#" className="hover:text-foreground">Terms</Link>
                    <Link href="#" className="hover:text-foreground">Help</Link>
                </div>
            </div>
        </footer>
    );
}

