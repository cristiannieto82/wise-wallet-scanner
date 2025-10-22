import { Product } from '@/types/product';
import { formatCLP, formatCarbon } from '@/lib/formatters';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScoreBar } from './ScoreBar';
import { ShoppingCart, Leaf, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ProductCardProps {
  product: Product;
  onAddToList?: (product: Product) => void;
  onClick?: () => void;
}

export const ProductCard = ({ product, onAddToList, onClick }: ProductCardProps) => {
  return (
    <Card 
      className="overflow-hidden transition-all hover:shadow-card-custom cursor-pointer group"
      onClick={onClick}
    >
      <div className="aspect-square w-full overflow-hidden bg-muted">
        <img
          src={product.image_url || '/placeholder.svg'}
          alt={product.name}
          className="h-full w-full object-cover transition-transform group-hover:scale-105"
        />
      </div>
      
      <div className="space-y-3 p-4">
        <div>
          <p className="text-xs text-muted-foreground">{product.brand}</p>
          <h3 className="font-semibold text-foreground line-clamp-2">{product.name}</h3>
          <p className="text-sm text-muted-foreground">{product.category}</p>
        </div>

        <div className="flex flex-wrap gap-1">
          {product.labels.slice(0, 3).map((label) => (
            <Badge key={label} variant="secondary" className="text-xs">
              {label}
            </Badge>
          ))}
        </div>

        <div className="space-y-2">
          <ScoreBar score={product.eco_score} label="Eco" type="eco" />
          <ScoreBar score={product.social_score} label="Social" type="social" />
        </div>

        <div className="flex items-center justify-between pt-2 border-t">
          <div>
            <p className="text-2xl font-bold text-primary">
              {formatCLP(product.last_seen_price_clp)}
            </p>
            <p className="text-xs text-muted-foreground">{product.last_vendor}</p>
          </div>
          
          {onAddToList && (
            <Button
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                onAddToList(product);
              }}
            >
              <ShoppingCart className="h-4 w-4 mr-1" />
              Agregar
            </Button>
          )}
        </div>

        {product.carbon_gco2e && (
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Leaf className="h-3 w-3" />
            {formatCarbon(product.carbon_gco2e)} por unidad
          </div>
        )}
      </div>
    </Card>
  );
};
