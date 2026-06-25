interface SkeletonProps {
  width?: string;
  height?: string;
  radius?: string;
}

export function Skeleton({ width = '100%', height = '1rem', radius }: SkeletonProps) {
  return (
    <span
      className="skeleton"
      style={{ display: 'block', width, height, borderRadius: radius }}
      aria-hidden
    />
  );
}
