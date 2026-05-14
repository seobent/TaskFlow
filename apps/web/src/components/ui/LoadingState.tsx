type LoadingStateProps = {
  className?: string;
  label?: string;
};

export function LoadingState({
  className = "",
  label = "Loading...",
}: LoadingStateProps) {
  return (
    <div
      className={[
        "flex min-h-52 items-center justify-center rounded-md border border-ink/10 bg-white p-8 text-ink/65 shadow-sm",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      role="status"
    >
      <span
        aria-hidden="true"
        className="mr-3 h-5 w-5 animate-spin rounded-full border-2 border-mint border-r-transparent"
      />
      <span className="text-sm font-semibold">{label}</span>
    </div>
  );
}
