import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Leaf, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export const Admin = () => {
  const [calculating, setCalculating] = useState(false);
  const [progress, setProgress] = useState(0);
  const queryClient = useQueryClient();

  const { data: stats } = useQuery({
    queryKey: ['carbon-stats'],
    queryFn: async () => {
      const { count: totalProducts, error: totalError } = await supabase
        .from('products')
        .select('*', { count: 'exact', head: true });

      if (totalError) throw totalError;

      const { count: withCarbon, error: carbonError } = await supabase
        .from('products')
        .select('*', { count: 'exact', head: true })
        .not('carbon_gco2e', 'is', null);

      if (carbonError) throw carbonError;

      return {
        total: totalProducts || 0,
        withCarbon: withCarbon || 0,
      };
    },
  });

  const calculateAllMutation = useMutation({
    mutationFn: async () => {
      setCalculating(true);
      setProgress(0);

      // Fetch all products
      const { data: products, error } = await supabase
        .from('products')
        .select('id, name');

      if (error) throw error;

      const total = products?.length || 0;
      let completed = 0;

      // Calculate carbon for each product
      for (const product of products || []) {
        try {
          await supabase.functions.invoke('calculate-carbon', {
            body: { productId: product.id },
          });
          completed++;
          setProgress(Math.round((completed / total) * 100));
        } catch (err) {
          console.error(`Error calculating carbon for ${product.name}:`, err);
        }
      }

      return { total, completed };
    },
    onSuccess: (data) => {
      setCalculating(false);
      queryClient.invalidateQueries({ queryKey: ['carbon-stats'] });
      queryClient.invalidateQueries({ queryKey: ['products-search'] });
      toast.success(`✅ Huella de carbono calculada para ${data.completed}/${data.total} productos`);
    },
    onError: () => {
      setCalculating(false);
      toast.error('Error al calcular huella de carbono');
    },
  });

  return (
    <div className="container py-8 space-y-8">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold text-foreground">Panel de Administración</h1>
        <p className="text-muted-foreground">
          Gestiona el cálculo de huella de carbono para todos los productos
        </p>
      </div>

      <Card className="p-6 space-y-6">
        <div className="flex items-center gap-2">
          <Leaf className="h-6 w-6 text-primary" />
          <h2 className="text-xl font-semibold text-foreground">
            Cálculo de Huella de Carbono
          </h2>
        </div>

        {stats && (
          <div className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-lg border bg-card p-4">
                <p className="text-sm text-muted-foreground">Total de Productos</p>
                <p className="text-3xl font-bold text-foreground">{stats.total}</p>
              </div>
              <div className="rounded-lg border bg-card p-4">
                <p className="text-sm text-muted-foreground">Con Huella de Carbono</p>
                <p className="text-3xl font-bold text-primary">{stats.withCarbon}</p>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Progreso</span>
                <span className="font-medium">
                  {stats.withCarbon} / {stats.total} ({Math.round((stats.withCarbon / stats.total) * 100)}%)
                </span>
              </div>
              <Progress value={(stats.withCarbon / stats.total) * 100} />
            </div>
          </div>
        )}

        {calculating && (
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">
              Calculando huella de carbono...
            </p>
            <Progress value={progress} />
          </div>
        )}

        <Button
          onClick={() => calculateAllMutation.mutate()}
          disabled={calculating}
          className="w-full"
        >
          {calculating ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Calculando... {progress}%
            </>
          ) : (
            <>
              <Leaf className="h-4 w-4 mr-2" />
              Calcular Huella de Carbono para Todos los Productos
            </>
          )}
        </Button>

        <div className="rounded-lg bg-muted p-4 space-y-2">
          <h3 className="font-semibold text-sm text-foreground">
            Cómo funciona el cálculo
          </h3>
          <ul className="text-xs text-muted-foreground space-y-1">
            <li>• Factores de emisión base por categoría (kg CO₂e/kg)</li>
            <li>• Productos orgánicos: -15% emisiones</li>
            <li>• Empaque reciclable: -10% emisiones</li>
            <li>• Biodegradable: -20% emisiones</li>
            <li>• Producción local (Chile): -25% emisiones</li>
            <li>• Empaque plástico: +15% emisiones</li>
          </ul>
        </div>
      </Card>
    </div>
  );
};
