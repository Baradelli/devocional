interface BannerProps {
  kind: 'error' | 'success';
  children: string;
}

export function Banner({ kind, children }: BannerProps) {
  return (
    <p className={`banner banner--${kind}`} role={kind === 'error' ? 'alert' : 'status'}>
      {children}
    </p>
  );
}
