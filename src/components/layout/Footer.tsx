export default function Footer() {
  return (
    <footer className="border-t bg-card">
      <div className="container mx-auto flex flex-col items-center justify-between gap-4 px-4 py-8 sm:flex-row sm:px-6 lg:px-8">
        <p className="text-sm text-muted-foreground">
          &copy; {new Date().getFullYear()} PropSpot. All rights reserved.
        </p>
        <div className="flex gap-4">
          <a href="#" className="text-sm text-muted-foreground hover:text-foreground">Terms of Service</a>
          <a href="#" className="text-sm text-muted-foreground hover:text-foreground">Privacy Policy</a>
        </div>
      </div>
    </footer>
  );
}
