type StarsProps = {
  count?: number;
  className?: string;
};

export function Stars({ count = 5, className = "text-accent" }: StarsProps) {
  return (
    <div className={`flex items-center gap-0.5 ${className}`} aria-hidden>
      {Array.from({ length: count }).map((_, index) => (
        <svg key={index} viewBox="0 0 20 20" className="size-3.5 fill-current">
          <path d="M10 1.5 12.4 7l6 .5-4.6 4 1.4 5.8L10 14.8 4.8 17.3l1.4-5.8L1.6 7.5l6-.5L10 1.5Z" />
        </svg>
      ))}
    </div>
  );
}
