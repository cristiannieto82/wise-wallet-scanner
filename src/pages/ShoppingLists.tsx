import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, Trash2, ShoppingCart, TrendingUp } from 'lucide-react';
import { formatCLP } from '@/lib/formatters';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

export const ShoppingLists = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [newListTitle, setNewListTitle] = useState('');
  const [newListBudget, setNewListBudget] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const { data: lists, isLoading } = useQuery({
    queryKey: ['shopping-lists'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate('/auth');
        return [];
      }

      const { data, error } = await supabase
        .from('shopping_lists')
        .select(`
          *,
          shopping_list_items(
            id,
            quantity,
            products(*)
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    },
  });

  const createListMutation = useMutation({
    mutationFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No user');

      const { data, error } = await supabase
        .from('shopping_lists')
        .insert({
          user_id: user.id,
          title: newListTitle || 'Nueva Lista',
          budget_clp: parseInt(newListBudget) || 50000,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shopping-lists'] });
      setNewListTitle('');
      setNewListBudget('');
      setIsDialogOpen(false);
      toast.success('Lista creada exitosamente');
    },
    onError: () => {
      toast.error('Error al crear la lista');
    },
  });

  const deleteListMutation = useMutation({
    mutationFn: async (listId: string) => {
      const { error } = await supabase
        .from('shopping_lists')
        .delete()
        .eq('id', listId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shopping-lists'] });
      toast.success('Lista eliminada');
    },
  });

  const calculateListTotal = (list: any) => {
    return list.shopping_list_items?.reduce((sum: number, item: any) => {
      return sum + (item.products?.last_seen_price_clp || 0) * item.quantity;
    }, 0) || 0;
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-pulse text-muted-foreground">Cargando listas...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-4xl font-bold text-foreground mb-2">Mis Listas</h1>
          <p className="text-muted-foreground">Gestiona tus listas de compras</p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button size="lg" className="gap-2">
              <Plus className="h-5 w-5" />
              Nueva Lista
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Crear Nueva Lista</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Nombre de la lista</label>
                <Input
                  placeholder="Ej: Compras del mes"
                  value={newListTitle}
                  onChange={(e) => setNewListTitle(e.target.value)}
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Presupuesto (CLP)</label>
                <Input
                  type="number"
                  placeholder="50000"
                  value={newListBudget}
                  onChange={(e) => setNewListBudget(e.target.value)}
                />
              </div>
              <Button 
                onClick={() => createListMutation.mutate()} 
                className="w-full"
                disabled={createListMutation.isPending}
              >
                {createListMutation.isPending ? 'Creando...' : 'Crear Lista'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {!lists || lists.length === 0 ? (
        <Card className="p-12 text-center border-dashed">
          <ShoppingCart className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
          <h3 className="text-xl font-semibold mb-2">No tienes listas aún</h3>
          <p className="text-muted-foreground mb-6">
            Crea tu primera lista de compras para comenzar a optimizar tus gastos
          </p>
          <Button onClick={() => setIsDialogOpen(true)} size="lg">
            <Plus className="h-5 w-5 mr-2" />
            Crear Primera Lista
          </Button>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {lists.map((list: any) => {
            const total = calculateListTotal(list);
            const itemCount = list.shopping_list_items?.length || 0;
            const budgetUsage = (total / list.budget_clp) * 100;

            return (
              <Card key={list.id} className="p-6 hover:shadow-lg transition-shadow">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-xl font-bold text-foreground mb-1">{list.title}</h3>
                    <p className="text-sm text-muted-foreground">
                      {itemCount} {itemCount === 1 ? 'producto' : 'productos'}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => deleteListMutation.mutate(list.id)}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>

                <div className="space-y-3 mb-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Total:</span>
                    <span className="font-bold text-foreground">{formatCLP(total)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Presupuesto:</span>
                    <span className="font-medium">{formatCLP(list.budget_clp)}</span>
                  </div>
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>Uso del presupuesto</span>
                      <span>{budgetUsage.toFixed(0)}%</span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className={`h-full transition-all ${
                          budgetUsage > 100 ? 'bg-destructive' : 
                          budgetUsage > 80 ? 'bg-warning' : 'bg-success'
                        }`}
                        style={{ width: `${Math.min(budgetUsage, 100)}%` }}
                      />
                    </div>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    className="flex-1"
                    onClick={() => navigate(`/lists/${list.id}`)}
                  >
                    <ShoppingCart className="h-4 w-4 mr-2" />
                    Ver
                  </Button>
                  <Button 
                    className="flex-1"
                    onClick={() => navigate(`/optimize/${list.id}`)}
                  >
                    <TrendingUp className="h-4 w-4 mr-2" />
                    Optimizar
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};