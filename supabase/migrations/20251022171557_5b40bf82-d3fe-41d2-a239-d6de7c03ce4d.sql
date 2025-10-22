-- Create products table
CREATE TABLE public.products (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  barcode TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  brand TEXT NOT NULL,
  category TEXT NOT NULL,
  nutrients JSONB DEFAULT '{}'::jsonb,
  labels JSONB DEFAULT '[]'::jsonb,
  eco_score INTEGER NOT NULL DEFAULT 50 CHECK (eco_score >= 0 AND eco_score <= 100),
  social_score INTEGER NOT NULL DEFAULT 50 CHECK (social_score >= 0 AND social_score <= 100),
  image_url TEXT,
  last_seen_price_clp INTEGER NOT NULL DEFAULT 0,
  last_vendor TEXT,
  carbon_gco2e DECIMAL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create stores table
CREATE TABLE public.stores (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  address TEXT NOT NULL,
  lat DECIMAL NOT NULL,
  lon DECIMAL NOT NULL,
  vendor_code TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create shopping_lists table
CREATE TABLE public.shopping_lists (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users ON DELETE CASCADE,
  title TEXT NOT NULL,
  budget_clp INTEGER NOT NULL DEFAULT 0,
  user_location_lat DECIMAL,
  user_location_lon DECIMAL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create shopping_list_items table
CREATE TABLE public.shopping_list_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  list_id UUID NOT NULL REFERENCES public.shopping_lists ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products ON DELETE CASCADE,
  quantity INTEGER NOT NULL DEFAULT 1,
  locked BOOLEAN NOT NULL DEFAULT false,
  chosen_price_clp INTEGER,
  vendor TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create alternatives table for product substitutions
CREATE TABLE public.alternatives (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID NOT NULL REFERENCES public.products ON DELETE CASCADE,
  alt_product_id UUID NOT NULL REFERENCES public.products ON DELETE CASCADE,
  similarity DECIMAL NOT NULL CHECK (similarity >= 0 AND similarity <= 1),
  price_delta_clp INTEGER NOT NULL DEFAULT 0,
  eco_delta INTEGER NOT NULL DEFAULT 0,
  social_delta INTEGER NOT NULL DEFAULT 0,
  explanation TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(product_id, alt_product_id)
);

-- Create price_snapshots table
CREATE TABLE public.price_snapshots (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID NOT NULL REFERENCES public.products ON DELETE CASCADE,
  store_id UUID NOT NULL REFERENCES public.stores ON DELETE CASCADE,
  price_clp INTEGER NOT NULL,
  captured_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shopping_lists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shopping_list_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.alternatives ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.price_snapshots ENABLE ROW LEVEL SECURITY;

-- RLS Policies for products (public read)
CREATE POLICY "Products are viewable by everyone"
  ON public.products FOR SELECT
  USING (true);

CREATE POLICY "Products are insertable by authenticated users"
  ON public.products FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Products are updatable by authenticated users"
  ON public.products FOR UPDATE
  TO authenticated
  USING (true);

-- RLS Policies for stores (public read)
CREATE POLICY "Stores are viewable by everyone"
  ON public.stores FOR SELECT
  USING (true);

-- RLS Policies for shopping_lists
CREATE POLICY "Users can view their own lists"
  ON public.shopping_lists FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own lists"
  ON public.shopping_lists FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own lists"
  ON public.shopping_lists FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own lists"
  ON public.shopping_lists FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for shopping_list_items
CREATE POLICY "Users can view items from their own lists"
  ON public.shopping_list_items FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.shopping_lists
    WHERE shopping_lists.id = shopping_list_items.list_id
    AND shopping_lists.user_id = auth.uid()
  ));

CREATE POLICY "Users can create items in their own lists"
  ON public.shopping_list_items FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.shopping_lists
    WHERE shopping_lists.id = shopping_list_items.list_id
    AND shopping_lists.user_id = auth.uid()
  ));

CREATE POLICY "Users can update items in their own lists"
  ON public.shopping_list_items FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM public.shopping_lists
    WHERE shopping_lists.id = shopping_list_items.list_id
    AND shopping_lists.user_id = auth.uid()
  ));

CREATE POLICY "Users can delete items from their own lists"
  ON public.shopping_list_items FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM public.shopping_lists
    WHERE shopping_lists.id = shopping_list_items.list_id
    AND shopping_lists.user_id = auth.uid()
  ));

-- RLS Policies for alternatives (public read)
CREATE POLICY "Alternatives are viewable by everyone"
  ON public.alternatives FOR SELECT
  USING (true);

-- RLS Policies for price_snapshots (public read)
CREATE POLICY "Price snapshots are viewable by everyone"
  ON public.price_snapshots FOR SELECT
  USING (true);

-- Create indexes for performance
CREATE INDEX idx_products_barcode ON public.products(barcode);
CREATE INDEX idx_products_category ON public.products(category);
CREATE INDEX idx_shopping_lists_user_id ON public.shopping_lists(user_id);
CREATE INDEX idx_shopping_list_items_list_id ON public.shopping_list_items(list_id);
CREATE INDEX idx_alternatives_product_id ON public.alternatives(product_id);
CREATE INDEX idx_price_snapshots_product_store ON public.price_snapshots(product_id, store_id);
CREATE INDEX idx_price_snapshots_captured_at ON public.price_snapshots(captured_at DESC);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_products_updated_at
  BEFORE UPDATE ON public.products
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_shopping_lists_updated_at
  BEFORE UPDATE ON public.shopping_lists
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();