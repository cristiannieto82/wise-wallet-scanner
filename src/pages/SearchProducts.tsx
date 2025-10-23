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
  const [searchTrigger, setSearchTrigger] = useState(0);

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
    queryKey: ['products-search', query, category, barcode, searchTrigger],
    queryFn: async () => {
      let queryBuilder = supabase.from('products').select('*');

      if (barcode.trim()) {
        queryBuilder = queryBuilder.eq('barcode', barcode.trim());
      } else if (query.trim()) {
        queryBuilder = queryBuilder.ilike('name', `%${query}%`);
        
        if (category && category !== 'all') {
          queryBuilder = queryBuilder.eq('category', category);
        }
      } else {
        return [];
      }

      const { data, error } = await queryBuilder.limit(20);
      
      if (error) throw error;
      return data as Product[];
    },
    enabled: searchTrigger > 0,
  });

  const handleSearch = () => {
    if (!query.trim() && !barcode.trim()) {
      toast.error('Ingresa un término de búsqueda');
      return;
    }
    setSearchTrigger(prev => prev + 1);
  };

  const handleBarcodeSearch = () => {
    if (!barcode.trim()) {
      toast.error('Ingresa un código de barras');
      return;
    }
    setQuery('');
    setSearchTrigger(prev => prev + 1);
  };

  const handleAddToList = (product: Product) => {
    toast.success(`${product.name} agregado a tu lista`);
  };

  return (
    <div className="container py-8 space-y-8">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold text-foreground">Buscar Productos</h1>
        <p className="text-muted-foreground">
          Encuentra productos por nombre, marca o código de barras
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
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
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

          <Button onClick={handleSearch} disabled={isLoading}>
            <Search className="h-4 w-4 mr-2" />
            Buscar
          </Button>
        </div>
      </div>

      {/* Results */}
      {results.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-foreground">
              Resultados ({results.length})
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

      {!isLoading && results.length === 0 && searchTrigger === 0 && (
        <div className="text-center py-12 space-y-4">
          <div className="flex justify-center">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-muted">
              <Search className="h-10 w-10 text-muted-foreground" />
            </div>
          </div>
          <div className="space-y-2">
            <h3 className="text-lg font-semibold text-foreground">Busca productos sostenibles</h3>
            <p className="text-muted-foreground max-w-md mx-auto">
              Usa el buscador o escanea códigos de barras para encontrar información detallada
              sobre productos y alternativas más sostenibles
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
