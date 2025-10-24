import { useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export const useCarbonCalculation = () => {
  return useMutation({
    mutationFn: async (productId: string) => {
      const { data, error } = await supabase.functions.invoke('calculate-carbon', {
        body: { productId },
      });

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      console.log('Carbon footprint calculated:', data);
    },
    onError: (error) => {
      console.error('Error calculating carbon footprint:', error);
      toast.error('Error al calcular huella de carbono');
    },
  });
};
