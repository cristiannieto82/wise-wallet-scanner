import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Search, ScanBarcode, Plus } from 'lucide-react';
import { ProductCard } from '@/components/ProductCard';
import { Product } from '@/types/product';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

export const SearchProducts = () => {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<string>('all');
  const [barcode, setBarcode] = useState('');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [showListDialog, setShowListDialog] = useState(false);
  const [selectedListId, setSelectedListId] = useState<string>('');
  const [showCreateList, setShowCreateList] = useState(false);
  const [newListTitle, setNewListTitle] = useState('');
  const [newListBudget, setNewListBudget] = useState('');
  const [currentUser, setCurrentUser] = useState<any>(null);
  
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setCurrentUser(user);
    });
  }, []);

  const { data: categories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('products')
        .select('category')
        .order('category');
      
      if (error) throw error;
      
      const uniqueCategories = [...new Set(data.map(p => p.category))];
      return uniqueCategories;
    },
  });

  const { data: results = [], isLoading } = useQuery({
    queryKey: ['products-search', query, category, barcode],
    queryFn: async () => {
      let queryBuilder = supabase.from('products').select('*');

      if (barcode.trim()) {
        queryBuilder = queryBuilder.eq('barcode', barcode.trim());
      } else {
        // Apply text filter if present
        if (query.trim()) {
          queryBuilder = queryBuilder.ilike('name', `%${query}%`);
        }
        
        // Apply category filter if not "all"
        if (category && category !== 'all') {
          queryBuilder = queryBuilder.eq('category', category);
        }
      }

      const { data, error } = await queryBuilder.limit(50);
      
      if (error) throw error;
      return data as Product[];
    },
  });

  const handleBarcodeSearch = () => {
    if (!barcode.trim()) {
      toast.error('Ingresa un código de barras');
      return;
    }
    setQuery('');
  };

  const { data: userLists = [] } = useQuery({
    queryKey: ['shopping-lists'],
    queryFn: async () => {
      if (!currentUser) return [];
      
      const { data, error } = await supabase
        .from('shopping_lists')
        .select('*')
        .eq('user_id', currentUser.id)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    },
    enabled: !!currentUser,
  });

  const createListMutation = useMutation({
    mutationFn: async ({ title, budget }: { title: string; budget: number }) => {
      const { data, error } = await supabase
        .from('shopping_lists')
        .insert([
          {
            title,
            budget_clp: budget,
            user_id: currentUser?.id,
          },
        ])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (newList) => {
      queryClient.invalidateQueries({ queryKey: ['shopping-lists'] });
      setSelectedListId(newList.id);
      setShowCreateList(false);
      setNewListTitle('');
      setNewListBudget('');
      toast.success('Lista creada exitosamente');
    },
    onError: () => {
      toast.error('Error al crear la lista');
    },
  });

  const addToListMutation = useMutation({
    mutationFn: async ({ listId, productId }: { listId: string; productId: string }) => {
      // Check if product already exists in the list
      const { data: existing } = await supabase
        .from('shopping_list_items')
        .select('*')
        .eq('list_id', listId)
        .eq('product_id', productId)
        .single();

      if (existing) {
        // Update quantity
        const { error } = await supabase
          .from('shopping_list_items')
          .update({ quantity: existing.quantity + 1 })
          .eq('id', existing.id);

        if (error) throw error;
        return { updated: true };
      } else {
        // Insert new item
        const { error } = await supabase
          .from('shopping_list_items')
          .insert([
            {
              list_id: listId,
              product_id: productId,
              quantity: 1,
            },
          ]);

        if (error) throw error;
        return { updated: false };
      }
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['shopping-lists'] });
      const listName = userLists.find(l => l.id === selectedListId)?.title || 'tu lista';
      if (result.updated) {
        toast.success(`Cantidad actualizada en ${listName}`);
      } else {
        toast.success(`✅ Producto agregado correctamente a ${listName}`);
      }
      setShowListDialog(false);
      setSelectedProduct(null);
      setSelectedListId('');
    },
    onError: () => {
      toast.error('Error al agregar el producto');
    },
  });

  const handleAddToList = (product: Product) => {
    if (!currentUser) {
      toast.error('Debes iniciar sesión para agregar productos a listas');
      navigate('/auth');
      return;
    }

    setSelectedProduct(product);
    setShowListDialog(true);
  };

  const handleConfirmAddToList = () => {
    if (!selectedListId || !selectedProduct) return;
    
    addToListMutation.mutate({
      listId: selectedListId,
      productId: selectedProduct.id,
    });
  };

  const handleCreateList = () => {
    if (!newListTitle.trim()) {
      toast.error('Ingresa un nombre para la lista');
      return;
    }

    const budget = parseInt(newListBudget) || 0;
    createListMutation.mutate({ title: newListTitle, budget });
  };

  return (
    <div className="container py-8 space-y-8">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold text-foreground">Buscar Productos Sostenibles</h1>
        <p className="text-muted-foreground">
          Encuentra productos de limpieza y autocuidado con información detallada de sostenibilidad
        </p>
      </div>

      {/* Barcode Scanner */}
      <div className="rounded-xl border bg-card p-6 space-y-4">
        <div className="flex items-center gap-2">
          <ScanBarcode className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-semibold text-foreground">Escanear Código de Barras</h2>
        </div>
        <div className="flex gap-2">
          <Input
            placeholder="Ingresa código de barras..."
            value={barcode}
            onChange={(e) => setBarcode(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleBarcodeSearch()}
          />
          <Button onClick={handleBarcodeSearch} disabled={isLoading}>
            <ScanBarcode className="h-4 w-4 mr-2" />
            Buscar
          </Button>
        </div>
        <p className="text-sm text-muted-foreground">
          En dispositivos móviles, podrás usar la cámara para escanear directamente
        </p>
      </div>

      {/* Text Search */}
      <div className="rounded-xl border bg-card p-6 space-y-4">
        <div className="flex items-center gap-2">
          <Search className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-semibold text-foreground">Búsqueda por Texto</h2>
        </div>
        
        <div className="grid gap-4 md:grid-cols-[1fr,200px,auto]">
          <Input
            placeholder="Buscar por nombre o marca..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          
          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger>
              <SelectValue placeholder="Categoría" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas</SelectItem>
              {categories.map((cat) => (
                <SelectItem key={cat} value={cat}>
                  {cat}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Results */}
      {results.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-foreground">
              {barcode.trim() 
                ? `Resultados para código: ${barcode} (${results.length})`
                : query.trim()
                ? `Mostrando resultados para: "${query}" (${results.length})`
                : `Mostrando todos los productos sostenibles (${results.length})`
              }
            </h2>
          </div>
          
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {results.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                onAddToList={handleAddToList}
              />
            ))}
          </div>
        </div>
      )}

      {!isLoading && results.length === 0 && (
        <div className="text-center py-12 space-y-4">
          <div className="flex justify-center">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-muted">
              <Search className="h-10 w-10 text-muted-foreground" />
            </div>
          </div>
          <div className="space-y-2">
            <h3 className="text-lg font-semibold text-foreground">No se encontraron productos</h3>
            <p className="text-muted-foreground max-w-md mx-auto">
              Intenta con otros términos de búsqueda o selecciona una categoría diferente
            </p>
          </div>
        </div>
      )}

      {/* Add to List Dialog */}
      <Dialog open={showListDialog} onOpenChange={setShowListDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Agregar a lista</DialogTitle>
            <DialogDescription>
              Selecciona la lista donde quieres agregar "{selectedProduct?.name}"
            </DialogDescription>
          </DialogHeader>

          {showCreateList ? (
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Nombre de la lista</label>
                <Input
                  placeholder="Ej: Lista de limpieza"
                  value={newListTitle}
                  onChange={(e) => setNewListTitle(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Presupuesto (CLP)</label>
                <Input
                  type="number"
                  placeholder="Ej: 50000"
                  value={newListBudget}
                  onChange={(e) => setNewListBudget(e.target.value)}
                />
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowCreateList(false);
                    setNewListTitle('');
                    setNewListBudget('');
                  }}
                  className="flex-1"
                >
                  Cancelar
                </Button>
                <Button
                  onClick={handleCreateList}
                  disabled={createListMutation.isPending}
                  className="flex-1"
                >
                  Crear Lista
                </Button>
              </div>
            </div>
          ) : (
            <>
              {userLists.length > 0 ? (
                <div className="space-y-4">
                  <Select value={selectedListId} onValueChange={setSelectedListId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona una lista" />
                    </SelectTrigger>
                    <SelectContent>
                      {userLists.map((list) => (
                        <SelectItem key={list.id} value={list.id}>
                          {list.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Button
                    variant="outline"
                    onClick={() => setShowCreateList(true)}
                    className="w-full"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Crear nueva lista
                  </Button>
                </div>
              ) : (
                <div className="text-center py-6 space-y-4">
                  <p className="text-muted-foreground">
                    No tienes listas creadas. Crea una para comenzar.
                  </p>
                  <Button onClick={() => setShowCreateList(true)} className="w-full">
                    <Plus className="h-4 w-4 mr-2" />
                    Crear mi primera lista
                  </Button>
                </div>
              )}

              {userLists.length > 0 && (
                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowListDialog(false);
                      setSelectedProduct(null);
                      setSelectedListId('');
                    }}
                  >
                    Cancelar
                  </Button>
                  <Button
                    onClick={handleConfirmAddToList}
                    disabled={!selectedListId || addToListMutation.isPending}
                  >
                    Confirmar
                  </Button>
                </DialogFooter>
              )}
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};
