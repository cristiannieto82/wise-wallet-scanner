import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ArrowLeft, Plus, Trash2, Lock, Unlock, Search, TrendingUp } from 'lucide-react';
import { formatCLP } from '@/lib/formatters';
import { toast } from 'sonner';
import type { Product } from '@/types/product';

export const ListDetail = () => {
  const { listId } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);

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

  const { data: searchResults } = useQuery({
    queryKey: ['products-search', searchQuery],
    queryFn: async () => {
      if (!searchQuery || searchQuery.length < 2) return [];
      
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .or(`name.ilike.%${searchQuery}%,barcode.eq.${searchQuery}`)
        .limit(10);

      if (error) throw error;
      return data as Product[];
    },
    enabled: searchQuery.length >= 2,
  });

  const addItemMutation = useMutation({
    mutationFn: async (productId: string) => {
      const { data, error } = await supabase
        .from('shopping_list_items')
        .insert({
          list_id: listId!,
          product_id: productId,
          quantity: 1,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shopping-list', listId] });
      setSearchQuery('');
      setIsSearchOpen(false);
      toast.success('Producto agregado');
    },
    onError: () => {
      toast.error('Error al agregar producto');
    },
  });

  const updateQuantityMutation = useMutation({
    mutationFn: async ({ itemId, quantity }: { itemId: string; quantity: number }) => {
      const { error } = await supabase
        .from('shopping_list_items')
        .update({ quantity })
        .eq('id', itemId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shopping-list', listId] });
    },
  });

  const toggleLockMutation = useMutation({
    mutationFn: async ({ itemId, locked }: { itemId: string; locked: boolean }) => {
      const { error } = await supabase
        .from('shopping_list_items')
        .update({ locked: !locked })
        .eq('id', itemId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shopping-list', listId] });
    },
  });

  const deleteItemMutation = useMutation({
    mutationFn: async (itemId: string) => {
      const { error } = await supabase
        .from('shopping_list_items')
        .delete()
        .eq('id', itemId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shopping-list', listId] });
      toast.success('Producto eliminado');
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

  const totalCost = list.shopping_list_items?.reduce(
    (sum: number, item: any) => sum + (item.products?.last_seen_price_clp || 0) * item.quantity,
    0
  ) || 0;

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <Button
        variant="ghost"
        onClick={() => navigate('/lists')}
        className="mb-6"
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        Volver a Listas
      </Button>

      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-4xl font-bold text-foreground mb-2">{list.title}</h1>
          <p className="text-muted-foreground">
            {list.shopping_list_items?.length || 0} productos · {formatCLP(totalCost)} de {formatCLP(list.budget_clp)}
          </p>
        </div>

        <div className="flex gap-2">
          <Dialog open={isSearchOpen} onOpenChange={setIsSearchOpen}>
            <DialogTrigger asChild>
              <Button size="lg">
                <Plus className="h-5 w-5 mr-2" />
                Agregar Producto
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Buscar Producto</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  <Input
                    placeholder="Buscar por nombre o código de barras..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>

                {searchResults && searchResults.length > 0 && (
                  <div className="space-y-2 max-h-[400px] overflow-y-auto">
                    {searchResults.map((product) => (
                      <button
                        key={product.id}
                        onClick={() => addItemMutation.mutate(product.id)}
                        className="w-full text-left p-4 hover:bg-accent rounded-lg transition-colors flex items-center gap-4"
                      >
                        <img
                          src={product.image_url || 'https://images.unsplash.com/photo-1534723452862-4c874018d66d?w=400'}
                          alt={product.name}
                          className="w-16 h-16 object-cover rounded"
                        />
                        <div className="flex-1">
                          <h3 className="font-semibold">{product.name}</h3>
                          <p className="text-sm text-muted-foreground">{product.brand}</p>
                        </div>
                        <span className="font-bold text-lg">{formatCLP(product.last_seen_price_clp)}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </DialogContent>
          </Dialog>

          <Button
            size="lg"
            variant="outline"
            onClick={() => navigate(`/optimize/${listId}`)}
          >
            <TrendingUp className="h-5 w-5 mr-2" />
            Optimizar
          </Button>
        </div>
      </div>

      <div className="space-y-4">
        {!list.shopping_list_items || list.shopping_list_items.length === 0 ? (
          <Card className="p-12 text-center border-dashed">
            <p className="text-muted-foreground mb-4">
              No hay productos en esta lista
            </p>
            <Button onClick={() => setIsSearchOpen(true)}>
              <Plus className="h-5 w-5 mr-2" />
              Agregar Primer Producto
            </Button>
          </Card>
        ) : (
          list.shopping_list_items.map((item: any) => (
            <Card key={item.id} className="p-6">
              <div className="flex items-center gap-4">
                <img
                  src={item.products?.image_url || 'https://images.unsplash.com/photo-1534723452862-4c874018d66d?w=400'}
                  alt={item.products?.name}
                  className="w-20 h-20 object-cover rounded-lg"
                />

                <div className="flex-1">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h3 className="font-bold text-lg">{item.products?.name}</h3>
                      <p className="text-sm text-muted-foreground">{item.products?.brand}</p>
                    </div>
                    {item.locked && (
                      <Badge variant="secondary">
                        <Lock className="h-3 w-3 mr-1" />
                        Bloqueado
                      </Badge>
                    )}
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">Cantidad:</span>
                      <Input
                        type="number"
                        min="1"
                        value={item.quantity}
                        onChange={(e) => updateQuantityMutation.mutate({
                          itemId: item.id,
                          quantity: parseInt(e.target.value) || 1
                        })}
                        className="w-20"
                      />
                    </div>

                    <div className="flex-1">
                      <span className="text-sm text-muted-foreground">Subtotal: </span>
                      <span className="font-bold text-lg">
                        {formatCLP((item.products?.last_seen_price_clp || 0) * item.quantity)}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => toggleLockMutation.mutate({
                      itemId: item.id,
                      locked: item.locked
                    })}
                  >
                    {item.locked ? <Lock className="h-4 w-4" /> : <Unlock className="h-4 w-4" />}
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => deleteItemMutation.mutate(item.id)}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>

      {list.shopping_list_items && list.shopping_list_items.length > 0 && (
        <Card className="mt-6 p-6">
          <div className="flex justify-between items-center">
            <span className="text-lg font-semibold">Total:</span>
            <div className="text-right">
              <div className="text-3xl font-bold text-primary">{formatCLP(totalCost)}</div>
              <div className="text-sm text-muted-foreground">
                {totalCost > list.budget_clp ? (
                  <span className="text-destructive">
                    Excede presupuesto por {formatCLP(totalCost - list.budget_clp)}
                  </span>
                ) : (
                  <span className="text-success">
                    Bajo presupuesto por {formatCLP(list.budget_clp - totalCost)}
                  </span>
                )}
              </div>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
};