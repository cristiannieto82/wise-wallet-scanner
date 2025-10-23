import { Product } from '@/types/product';
import { formatCLP, formatCarbon } from '@/lib/formatters';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScoreBar } from './ScoreBar';
import { ShoppingCart, Leaf, Recycle, Droplet } from 'lucide-react';
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

        {/* Indicadores de sostenibilidad */}
        <div className="flex flex-wrap gap-2">
          {product.product_info?.biodegradable && (
            <Badge variant="secondary" className="gap-1 text-xs">
              <Leaf className="h-3 w-3" />
              Biodegradable
            </Badge>
          )}
          {product.product_info?.package_recyclable && (
            <Badge variant="secondary" className="gap-1 text-xs">
              <Recycle className="h-3 w-3" />
              Reciclable
            </Badge>
          )}
          {product.product_info?.vegan && (
            <Badge variant="secondary" className="text-xs">
              Vegano
            </Badge>
          )}
          {product.product_info?.cruelty_free && (
            <Badge variant="secondary" className="text-xs">
              Cruelty-free
            </Badge>
          )}
        </div>

        <div className="space-y-2">
          <ScoreBar score={product.eco_score} label="Impacto ambiental" type="eco" />
          <ScoreBar score={product.social_score} label="Responsabilidad social" type="social" />
        </div>

        <div className="flex items-center justify-between pt-2 border-t">
          <div>
            <p className="text-2xl font-bold text-primary">
              {formatCLP(product.last_seen_price_clp)}
            </p>
            <p className="text-xs text-muted-foreground">{product.last_vendor}</p>
            {product.product_info?.doses_per_package && (
              <p className="text-xs text-muted-foreground">
                {formatCLP(product.last_seen_price_clp / product.product_info.doses_per_package)} / uso
              </p>
            )}
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
            {formatCarbon(product.carbon_gco2e)} de transporte
          </div>
        )}
        
        {product.product_info?.package_type && (
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Droplet className="h-3 w-3" />
            Envase: {product.product_info.package_type}
          </div>
        )}
      </div>
    </Card>
  );
};
