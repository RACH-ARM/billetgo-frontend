interface Props {
  className?: string;
  height?: number;
}

export default function BilletGabLogo({ className = '', height = 40 }: Props) {
  const width = Math.round(height * (1813 / 868));
  return (
    <img
      src="/logo-color.png"
      alt="BilletGab"
      height={height}
      width={width}
      className={className}
      style={{ height, width: 'auto', objectFit: 'contain', display: 'block' }}
      draggable={false}
    />
  );
}
