function DovizAttribution() {
  return (
    <div className="flex items-center gap-2 text-xs text-muted-foreground">
      <span>powered by</span>
      <a
        href="https://doviz.com"
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1.5 font-medium text-foreground/70 transition-colors hover:text-foreground"
      >
        <img
          src="https://doviz.com/favicon.ico"
          alt="doviz.com"
          width={16}
          height={16}
          className="rounded-sm"
        />
        Doviz.com
      </a>
    </div>
  )
}

export { DovizAttribution }
