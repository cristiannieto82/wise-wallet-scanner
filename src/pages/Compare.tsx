import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Search, ArrowRight, TrendingDown, TrendingUp } from 'lucide-react';
import { formatCLP, getScoreColor, formatCarbon } from '@/lib/formatters';
import { ScoreBar } from '@/components/ScoreBar';
import type { Product } from '@/types/product';

export const Compare = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  const { data: products } = useQuery({
    queryKey: ['products-search', searchQuery],
    queryFn: async () => {
      if (!searchQuery || searchQuery.length < 2) return [];
      
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .ilike('name', `%${searchQuery}%`)
        .limit(10);

      if (error) throw error;
      return data as Product[];
    },
    enabled: searchQuery.length >= 2,
  });

  const { data: alternatives } = useQuery({
    queryKey: ['alternatives', selectedProduct?.id],
    queryFn: async () => {
      if (!selectedProduct) return [];

      const { data, error } = await supabase
        .from('alternatives')
        .select(`
          *,
          alt_product:products!alternatives_alt_product_id_fkey(*)
        `)
        .eq('product_id', selectedProduct.id)
        .order('similarity', { ascending: false })
        .limit(5);

      if (error) throw error;
      return data;
    },
    enabled: !!selectedProduct,
  });

  const renderComparison = (original: number, alternative: number, type: 'price' | 'score') => {
    const diff = type === 'price' ? alternative - original : original - alternative;
    const isPositive = diff < 0;
    
    return (
      <div className={`flex items-center gap-1 text-sm font-medium ${
        isPositive ? 'text-success' : 'text-destructive'
      }`}>
        {isPositive ? <TrendingDown className="h-4 w-4" /> : <TrendingUp className="h-4 w-4" />}
        {type === 'price' ? formatCLP(Math.abs(diff)) : `${Math.abs(diff)} pts`}
      </div>
    );
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-foreground mb-2">Comparador de Productos</h1>
        <p className="text-muted-foreground">
          Busca un producto y encuentra alternativas más sostenibles o económicas
        </p>
      </div>

      <div className="mb-8">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input
            placeholder="Busca un producto para comparar..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 h-12 text-lg"
          />
        </div>

        {products && products.length > 0 && !selectedProduct && (
          <Card className="mt-4 p-4">
            <div className="space-y-2">
              {products.map((product) => (
                <button
                  key={product.id}
                  onClick={() => setSelectedProduct(product)}
                  className="w-full text-left p-4 hover:bg-accent rounded-lg transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold">{product.name}</h3>
                      <p className="text-sm text-muted-foreground">{product.brand}</p>
                    </div>
                    <span className="font-bold text-lg">{formatCLP(product.last_seen_price_clp)}</span>
                  </div>
                </button>
              ))}
            </div>
          </Card>
        )}
      </div>

      {selectedProduct && (
        <div className="space-y-6">
          <Card className="p-6">
            <div className="flex items-start gap-6">
              <img
                src={selectedProduct.image_url || 'https://images.unsplash.com/photo-1534723452862-4c874018d66d?w=400'}
                alt={selectedProduct.name}
                className="w-32 h-32 object-cover rounded-lg"
              />
              <div className="flex-1">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h2 className="text-2xl font-bold mb-1">{selectedProduct.name}</h2>
                    <p className="text-muted-foreground">{selectedProduct.brand}</p>
                    <div className="flex gap-2 mt-2">
                      {Array.isArray(selectedProduct.labels) && selectedProduct.labels.map((label: string, i: number) => (
                        <Badge key={i} variant="secondary">{label}</Badge>
                      ))}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-3xl font-bold text-primary mb-1">
                      {formatCLP(selectedProduct.last_seen_price_clp)}
                    </div>
                    <p className="text-sm text-muted-foreground">{formatCarbon(selectedProduct.carbon_gco2e)}</p>
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <ScoreBar score={selectedProduct.eco_score} label="Puntaje Ambiental" type="eco" />
                  <ScoreBar score={selectedProduct.social_score} label="Puntaje Social" type="social" />
                </div>
              </div>
            </div>
          </Card>

          {alternatives && alternatives.length > 0 ? (
            <div>
              <h3 className="text-2xl font-bold mb-4">Alternativas Recomendadas</h3>
              <div className="space-y-4">
                {alternatives.map((alt: any) => {
                  const altProduct = alt.alt_product as Product;
                  return (
                    <Card key={alt.id} className="p-6">
                      <div className="flex items-start gap-6">
                        <img
                          src={altProduct.image_url || 'https://images.unsplash.com/photo-1534723452862-4c874018d66d?w=400'}
                          alt={altProduct.name}
                          className="w-24 h-24 object-cover rounded-lg"
                        />
                        <div className="flex-1">
                          <div className="flex items-start justify-between mb-4">
                            <div>
                              <h4 className="text-xl font-bold mb-1">{altProduct.name}</h4>
                              <p className="text-muted-foreground">{altProduct.brand}</p>
                              <Badge className="mt-2">
                                {(alt.similarity * 100).toFixed(0)}% similar
                              </Badge>
                            </div>
                            <div className="text-right">
                              <div className="text-2xl font-bold mb-1">
                                {formatCLP(altProduct.last_seen_price_clp)}
                              </div>
                              {renderComparison(selectedProduct.last_seen_price_clp, altProduct.last_seen_price_clp, 'price')}
                            </div>
                          </div>

                          <div className="grid gap-3 md:grid-cols-3 mb-3">
                            <div>
                              <div className="flex items-center justify-between text-sm mb-1">
                                <span className="text-muted-foreground">Ambiental</span>
                                <span className={getScoreColor(altProduct.eco_score)}>
                                  {altProduct.eco_score}
                                </span>
                              </div>
                              {renderComparison(selectedProduct.eco_score, altProduct.eco_score, 'score')}
                            </div>
                            <div>
                              <div className="flex items-center justify-between text-sm mb-1">
                                <span className="text-muted-foreground">Social</span>
                                <span className={getScoreColor(altProduct.social_score)}>
                                  {altProduct.social_score}
                                </span>
                              </div>
                              {renderComparison(selectedProduct.social_score, altProduct.social_score, 'score')}
                            </div>
                            <div>
                              <div className="flex items-center justify-between text-sm mb-1">
                                <span className="text-muted-foreground">Carbono</span>
                                <span className="text-sm">{formatCarbon(altProduct.carbon_gco2e)}</span>
                              </div>
                            </div>
                          </div>

                          {alt.explanation && (
                            <p className="text-sm text-muted-foreground bg-muted p-3 rounded-lg">
                              {alt.explanation}
                            </p>
                          )}
                        </div>
                      </div>
                    </Card>
                  );
                })}
              </div>
            </div>
          ) : (
            <Card className="p-12 text-center">
              <p className="text-muted-foreground">
                No hay alternativas disponibles para este producto
              </p>
            </Card>
          )}
        </div>
      )}

      {!selectedProduct && (!products || products.length === 0) && searchQuery.length >= 2 && (
        <Card className="p-12 text-center">
          <Search className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
          <p className="text-muted-foreground">
            No se encontraron productos
          </p>
        </Card>
      )}
    </div>
  );
};