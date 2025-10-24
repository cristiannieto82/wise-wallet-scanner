import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ArrowLeft, Sparkles, TrendingDown, TrendingUp, Leaf, Users } from 'lucide-react';
import { formatCLP } from '@/lib/formatters';
import { toast } from 'sonner';

export const Optimize = () => {
  const { listId } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [optimizationResult, setOptimizationResult] = useState<any>(null);

  const { data: list, isLoading } = useQuery({
    queryKey: ['shopping-list', listId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('shopping_lists')
        .select(`
          *,
          shopping_list_items(
            *,
            products(*)
          )
        `)
        .eq('id', listId)
        .single();

      if (error) throw error;
      return data;
    },
  });

  const optimizeMutation = useMutation({
    mutationFn: async () => {
      setIsOptimizing(true);
      
      // Use the multi-objective knapsack algorithm edge function
      const { data, error } = await supabase.functions.invoke('optimize-knapsack', {
        body: { 
          listId,
          weights: {
            price: 0.4,
            environmental: 0.3,
            social: 0.3,
          }
        }
      });

      if (error) throw error;
      
      if (!data.success) {
        throw new Error(data.error || 'Error en optimización');
      }

      // Transform the optimization results to match the UI format
      const optimization = data.optimization;
      const optimizations = [];

      for (const item of optimization.selectedItems) {
        if (item.isAlternative) {
          // Find the original item to compare
          const originalItem = list?.shopping_list_items?.find((li: any) => li.id === item.itemId);
          if (originalItem) {
            optimizations.push({
              alt_product_id: item.productId,
              alt_product: item.product,
              originalItem: originalItem,
              product_id: originalItem.product_id,
              explanation: `Esta alternativa mejora tu compra con un ${optimization.ecoImprovement > 0 ? 'mejor' : ''} impacto ambiental (${optimization.ecoImprovement.toFixed(0)} pts) y ${optimization.socialImprovement > 0 ? 'mejor' : ''} impacto social (${optimization.socialImprovement.toFixed(0)} pts), con un ahorro de ${formatCLP(optimization.savings)}.`
            });
          }
        }
      }

      return {
        suggestions: optimizations,
        totalSavings: optimization.savings,
        withinBudget: optimization.withinBudget,
        ecoImprovement: optimization.ecoImprovement,
        socialImprovement: optimization.socialImprovement,
      };
    },
    onSuccess: (data) => {
      setOptimizationResult(data.suggestions);
      setIsOptimizing(false);
      if (data.suggestions.length === 0) {
        toast.info('Tu lista ya está optimizada');
      } else {
        toast.success(`Encontramos ${data.suggestions.length} mejoras con ahorro de ${formatCLP(data.totalSavings)}`);
      }
    },
    onError: (error: any) => {
      setIsOptimizing(false);
      toast.error(error.message || 'Error al optimizar la lista');
    },
  });

  const applyOptimizationMutation = useMutation({
    mutationFn: async (suggestions: any[]) => {
      for (const suggestion of suggestions) {
        await supabase
          .from('shopping_list_items')
          .update({
            product_id: suggestion.alt_product_id,
          })
          .eq('id', suggestion.originalItem.id);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shopping-list', listId] });
      toast.success('Optimización aplicada exitosamente');
      navigate(`/lists/${listId}`);
    },
    onError: () => {
      toast.error('Error al aplicar optimización');
    },
  });

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-pulse text-muted-foreground">Cargando...</div>
        </div>
      </div>
    );
  }

  if (!list) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="p-12 text-center">
          <p className="text-muted-foreground">Lista no encontrada</p>
          <Button onClick={() => navigate('/lists')} className="mt-4">
            Volver a Listas
          </Button>
        </Card>
      </div>
    );
  }

  const currentTotal = list.shopping_list_items?.reduce(
    (sum: number, item: any) => sum + (item.products?.last_seen_price_clp || 0) * item.quantity,
    0
  ) || 0;

  const optimizedTotal = optimizationResult
    ? currentTotal - optimizationResult.reduce((sum: number, opt: any) => {
        const priceDiff = opt.originalItem.products.last_seen_price_clp - opt.alt_product.last_seen_price_clp;
        return sum + (priceDiff * opt.originalItem.quantity);
      }, 0)
    : currentTotal;

  const avgEcoImprovement = optimizationResult
    ? optimizationResult.reduce((sum: number, opt: any) => {
        return sum + (opt.alt_product.eco_score - opt.originalItem.products.eco_score);
      }, 0) / optimizationResult.length
    : 0;

  const avgSocialImprovement = optimizationResult
    ? optimizationResult.reduce((sum: number, opt: any) => {
        return sum + (opt.alt_product.social_score - opt.originalItem.products.social_score);
      }, 0) / optimizationResult.length
    : 0;

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <Button
        variant="ghost"
        onClick={() => navigate(`/lists/${listId}`)}
        className="mb-6"
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        Volver a la Lista
      </Button>

      <div className="mb-8">
        <h1 className="text-4xl font-bold text-foreground mb-2">Optimizar Lista</h1>
        <p className="text-muted-foreground">{list.title}</p>
      </div>

      {!optimizationResult ? (
        <Card className="p-12 text-center">
          <div className="flex justify-center mb-6">
            <div className="h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center">
              <Sparkles className="h-10 w-10 text-primary" />
            </div>
          </div>
          <h2 className="text-2xl font-bold mb-2">Optimiza tu Lista de Compras</h2>
          <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
            Nuestro sistema analizará cada producto desbloqueado en tu lista y buscará alternativas
            que te ayuden a ahorrar dinero y elegir productos más sostenibles.
          </p>
          <div className="grid gap-4 md:grid-cols-3 mb-8 text-left">
            <div className="p-4 bg-muted rounded-lg">
              <TrendingDown className="h-8 w-8 text-success mb-2" />
              <h3 className="font-semibold mb-1">Ahorro Económico</h3>
              <p className="text-sm text-muted-foreground">
                Encuentra productos similares a mejor precio
              </p>
            </div>
            <div className="p-4 bg-muted rounded-lg">
              <Leaf className="h-8 w-8 text-success mb-2" />
              <h3 className="font-semibold mb-1">Impacto Ambiental</h3>
              <p className="text-sm text-muted-foreground">
                Mejora tu huella ecológica
              </p>
            </div>
            <div className="p-4 bg-muted rounded-lg">
              <Users className="h-8 w-8 text-success mb-2" />
              <h3 className="font-semibold mb-1">Responsabilidad Social</h3>
              <p className="text-sm text-muted-foreground">
                Apoya prácticas éticas
              </p>
            </div>
          </div>
          <Button
            size="lg"
            onClick={() => optimizeMutation.mutate()}
            disabled={isOptimizing}
            className="gap-2"
          >
            {isOptimizing ? (
              <>
                <div className="h-4 w-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                Analizando...
              </>
            ) : (
              <>
                <Sparkles className="h-5 w-5" />
                Comenzar Optimización
              </>
            )}
          </Button>
        </Card>
      ) : (
        <div className="space-y-6">
          <Card className="p-6 bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
            <h2 className="text-2xl font-bold mb-6">Resultados de Optimización</h2>
            <div className="grid gap-6 md:grid-cols-3">
              <div>
                <p className="text-sm text-muted-foreground mb-2">Ahorro Potencial</p>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-bold text-success">
                    {formatCLP(currentTotal - optimizedTotal)}
                  </span>
                  <TrendingDown className="h-6 w-6 text-success" />
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {((currentTotal - optimizedTotal) / currentTotal * 100).toFixed(1)}% de descuento
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-2">Mejora Ambiental</p>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-bold text-success">
                    {avgEcoImprovement > 0 ? '+' : ''}{avgEcoImprovement.toFixed(0)}
                  </span>
                  {avgEcoImprovement > 0 && <TrendingUp className="h-6 w-6 text-success" />}
                </div>
                <p className="text-xs text-muted-foreground mt-1">Puntos promedio</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-2">Mejora Social</p>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-bold text-success">
                    {avgSocialImprovement > 0 ? '+' : ''}{avgSocialImprovement.toFixed(0)}
                  </span>
                  {avgSocialImprovement > 0 && <TrendingUp className="h-6 w-6 text-success" />}
                </div>
                <p className="text-xs text-muted-foreground mt-1">Puntos promedio</p>
              </div>
            </div>
          </Card>

          {optimizationResult.length > 0 ? (
            <>
              <div>
                <h3 className="text-xl font-bold mb-4">Cambios Sugeridos ({optimizationResult.length})</h3>
                <div className="space-y-4">
                  {optimizationResult.map((opt: any, index: number) => (
                    <Card key={index} className="p-6">
                      <div className="grid md:grid-cols-2 gap-6">
                        {/* Original Product */}
                        <div className="flex gap-4 opacity-60">
                          <img
                            src={opt.originalItem.products.image_url || 'https://images.unsplash.com/photo-1534723452862-4c874018d66d?w=400'}
                            alt={opt.originalItem.products.name}
                            className="w-20 h-20 object-cover rounded-lg"
                          />
                          <div className="flex-1">
                            <Badge variant="outline" className="mb-2">Actual</Badge>
                            <h4 className="font-semibold">{opt.originalItem.products.name}</h4>
                            <p className="text-sm text-muted-foreground">{opt.originalItem.products.brand}</p>
                            <p className="font-bold mt-2">{formatCLP(opt.originalItem.products.last_seen_price_clp)}</p>
                          </div>
                        </div>

                        {/* Alternative Product */}
                        <div className="flex gap-4">
                          <img
                            src={opt.alt_product.image_url || 'https://images.unsplash.com/photo-1534723452862-4c874018d66d?w=400'}
                            alt={opt.alt_product.name}
                            className="w-20 h-20 object-cover rounded-lg"
                          />
                          <div className="flex-1">
                            <Badge className="mb-2 bg-success">Recomendado</Badge>
                            <h4 className="font-semibold">{opt.alt_product.name}</h4>
                            <p className="text-sm text-muted-foreground">{opt.alt_product.brand}</p>
                            <div className="flex items-baseline gap-2 mt-2">
                              <p className="font-bold">{formatCLP(opt.alt_product.last_seen_price_clp)}</p>
                              <span className="text-sm text-success">
                                -{formatCLP(opt.originalItem.products.last_seen_price_clp - opt.alt_product.last_seen_price_clp)}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {opt.explanation && (
                        <p className="text-sm text-muted-foreground bg-muted p-3 rounded-lg mt-4">
                          {opt.explanation}
                        </p>
                      )}
                    </Card>
                  ))}
                </div>
              </div>

              <div className="flex gap-4 justify-end">
                <Button
                  variant="outline"
                  onClick={() => navigate(`/lists/${listId}`)}
                >
                  Cancelar
                </Button>
                <Button
                  onClick={() => applyOptimizationMutation.mutate(optimizationResult)}
                  disabled={applyOptimizationMutation.isPending}
                  className="gap-2"
                >
                  <Sparkles className="h-4 w-4" />
                  Aplicar Optimización
                </Button>
              </div>
            </>
          ) : (
            <Card className="p-12 text-center">
              <div className="flex justify-center mb-4">
                <div className="h-16 w-16 rounded-full bg-success/10 flex items-center justify-center">
                  <Sparkles className="h-8 w-8 text-success" />
                </div>
              </div>
              <h3 className="text-xl font-bold mb-2">¡Tu lista ya está optimizada!</h3>
              <p className="text-muted-foreground mb-6">
                No encontramos alternativas mejores para los productos en tu lista.
              </p>
              <Button onClick={() => navigate(`/lists/${listId}`)}>
                Volver a la Lista
              </Button>
            </Card>
          )}
        </div>
      )}
    </div>
  );
};
