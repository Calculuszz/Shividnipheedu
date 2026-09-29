// Themed replacement for the browser's "Please fill out this field" bubble
export default function FieldError({ message }: { message: string }) {
  return (
    <p role="alert" className="mt-2 flex items-center gap-1.5 text-sm text-halloween-error font-iannnnn-owl">
      <svg className="w-4 h-4 shrink-0" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
      </svg>
      {message}
    </p>
  );
}
