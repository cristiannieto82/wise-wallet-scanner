import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, ScanBarcode } from 'lucide-react';
import { ProductCard } from '@/components/ProductCard';
import { Product } from '@/types/product';
import { toast } from 'sonner';

export const SearchProducts = () => {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<string>('all');
  const [barcode, setBarcode] = useState('');

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

  const handleAddToList = (product: Product) => {
    toast.success(`${product.name} agregado a tu lista`);
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
    </div>
  );
};
