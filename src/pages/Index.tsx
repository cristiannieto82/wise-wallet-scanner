import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Sparkles, Leaf, ShoppingCart, TrendingDown, Award } from 'lucide-react';

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="container py-20 space-y-8 text-center">
        <div className="inline-flex items-center gap-2 rounded-full border bg-muted px-4 py-2">
          <Sparkles className="h-4 w-4 text-primary" />
          <span className="text-sm font-medium">Compra inteligente y sostenible</span>
        </div>
        
        <h1 className="text-4xl md:text-6xl font-bold text-foreground max-w-4xl mx-auto">
          Optimiza tus compras de <span className="text-primary">limpieza y autocuidado</span>
        </h1>
        
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          Ahorra dinero y cuida el planeta eligiendo los productos más sostenibles
          para tu hogar y cuidado personal
        </p>
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link to="/search">
            <Button size="lg" className="gap-2">
              <ShoppingCart className="h-5 w-5" />
              Comenzar a comprar
            </Button>
          </Link>
          <Link to="/dashboard">
            <Button size="lg" variant="outline">
              Ver mi dashboard
            </Button>
          </Link>
        </div>
      </section>

      {/* Features */}
      <section className="container py-16">
        <div className="grid md:grid-cols-3 gap-8">
          <Card className="p-6 space-y-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-eco-gradient">
              <Leaf className="h-6 w-6 text-white" />
            </div>
            <h3 className="text-xl font-semibold">Impacto Ambiental</h3>
            <p className="text-muted-foreground">
              Conoce la huella ecológica de cada producto: envase, biodegradabilidad
              y químicos agresivos
            </p>
          </Card>

          <Card className="p-6 space-y-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-price-gradient">
              <TrendingDown className="h-6 w-6 text-white" />
            </div>
            <h3 className="text-xl font-semibold">Ahorro Inteligente</h3>
            <p className="text-muted-foreground">
              Calcula el costo por uso real y encuentra las mejores ofertas
              sin comprometer calidad
            </p>
          </Card>

          <Card className="p-6 space-y-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-social-gradient">
              <Award className="h-6 w-6 text-white" />
            </div>
            <h3 className="text-xl font-semibold">Certificaciones Éticas</h3>
            <p className="text-muted-foreground">
              Productos veganos, cruelty-free y con certificaciones verificadas
              de comercio justo
            </p>
          </Card>
        </div>
      </section>

      {/* Categories */}
      <section className="container py-16 space-y-8">
        <div className="text-center space-y-4">
          <h2 className="text-3xl font-bold">Categorías disponibles</h2>
          <p className="text-muted-foreground">
            Explora productos sostenibles en todas las categorías de Liqui.cl
          </p>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {['Infantil y bebé', 'Pañales', 'Cuidado personal', 'Cuidado adulto', 
            'Limpieza', 'Papeles', 'Outlet'].map((category) => (
            <Link key={category} to="/search">
              <Card className="p-6 text-center hover:shadow-card-custom transition-all cursor-pointer group">
                <p className="font-medium group-hover:text-primary transition-colors">{category}</p>
              </Card>
            </Link>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="container py-20">
        <Card className="p-12 text-center space-y-6 bg-eco-gradient">
          <h2 className="text-3xl font-bold text-white">
            ¿Listo para optimizar tus compras?
          </h2>
          <p className="text-white/90 max-w-2xl mx-auto">
            Crea tu primera lista de compras y descubre cuánto puedes ahorrar
            mientras reduces tu impacto ambiental
          </p>
          <Link to="/lists">
            <Button size="lg" variant="secondary">
              Crear mi lista
            </Button>
          </Link>
        </Card>
      </section>
    </div>
  );
};

export default Index;
