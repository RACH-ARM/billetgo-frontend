import { motion } from 'framer-motion';
import { ButtonHTMLAttributes } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
}

export default function Button({ variant = 'primary', size = 'md', isLoading, children, disabled, className = '', ...props }: ButtonProps) {
  const variants = {
    primary: 'bg-neon-gradient hover:shadow-neon-rose text-white',
    secondary: 'bg-bg-card border border-violet-neon/40 hover:border-violet-neon text-white',
    ghost: 'text-white/70 hover:text-white hover:bg-white/5',
    danger: 'bg-rose-neon/20 border border-rose-neon/40 hover:bg-rose-neon/30 text-rose-neon',
  };
  const sizes = { sm: 'px-3 py-1.5 text-sm', md: 'px-5 py-2.5', lg: 'px-8 py-3.5 text-lg' };

  return (
    <motion.button
      whileHover={{ scale: disabled || isLoading ? 1 : 1.02 }}
      whileTap={{ scale: disabled || isLoading ? 1 : 0.97 }}
      disabled={disabled || isLoading}
      className={`font-sora font-semibold rounded-xl transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {isLoading && <span className="w-4 h-4 border-2 border-white/25 border-t-white rounded-full animate-spin flex-shrink-0" />}
      {children}
    </motion.button>
  );
}
