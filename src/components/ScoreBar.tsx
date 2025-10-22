import { cn } from '@/lib/utils';
import { getScoreColor, getScoreLabel } from '@/lib/formatters';

interface ScoreBarProps {
  score: number;
  label: string;
  type?: 'eco' | 'social' | 'price';
  className?: string;
}

export const ScoreBar = ({ score, label, type = 'eco', className }: ScoreBarProps) => {
  const getGradientClass = () => {
    switch (type) {
      case 'eco':
        return 'bg-eco-gradient';
      case 'social':
        return 'bg-social-gradient';
      case 'price':
        return 'bg-price-gradient';
      default:
        return 'bg-primary';
    }
  };

  return (
    <div className={cn('space-y-2', className)}>
      <div className="flex items-center justify-between text-sm">
        <span className="font-medium text-foreground">{label}</span>
        <span className={cn('font-bold', getScoreColor(score))}>
          {score}/100 · {getScoreLabel(score)}
        </span>
      </div>
      <div className="relative h-3 w-full overflow-hidden rounded-full bg-muted">
        <div
          className={cn('h-full transition-all duration-500 ease-out', getGradientClass())}
          style={{ width: `${score}%` }}
        />
      </div>
    </div>
  );
};
