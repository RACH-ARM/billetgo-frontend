interface Props {
  message?: string;
  inline?: boolean;
}

export default function SplashLoader({ inline = false }: Props) {
  return (
    <div style={{
      ...(inline ? { padding: '60px 0' } : { minHeight: '100vh' }),
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    }}>
      <div style={{
        width: 36,
        height: 36,
        borderRadius: '50%',
        border: '3px solid rgba(123,47,190,0.2)',
        borderTopColor: '#9B4FDE',
        animation: 'spin 0.8s linear infinite',
      }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
