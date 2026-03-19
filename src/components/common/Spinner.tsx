export default function Spinner({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  const sizes = { sm: 'w-5 h-5', md: 'w-8 h-8', lg: 'w-12 h-12' };
  return (
    <div className={`${sizes[size]} border-2 border-violet-neon/30 border-t-violet-neon rounded-full animate-spin`} />
  );
}

export function FullPageSpinner() {
  return (
    <div className="min-h-screen bg-bg flex items-center justify-center">
      <Spinner size="lg" />
    </div>
  );
}
