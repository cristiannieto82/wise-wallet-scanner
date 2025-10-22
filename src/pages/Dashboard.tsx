import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { formatCLP } from '@/lib/formatters';
import { ArrowRight, TrendingDown, Leaf, Users, ShoppingBag, ListChecks, GitCompare } from 'lucide-react';
import { Link } from 'react-router-dom';
import { ScoreBar } from '@/components/ScoreBar';

export const Dashboard = () => {
  // Mock data - en producción vendría de un store/API
  const stats = {
    totalSavings: 45680,
    avgEcoScore: 76,
    avgSocialScore: 72,
    listsCount: 8,
  };

  return (
    <div className="container py-8 space-y-8">
      {/* Hero Section */}
      <div className="relative overflow-hidden rounded-2xl bg-eco-gradient p-8 text-white shadow-eco">
        <div className="relative z-10 max-w-2xl space-y-4">
          <h1 className="text-4xl font-bold">¡Bienvenido a LiquiVerde!</h1>
          <p className="text-lg text-white/90">
            Ahorra dinero y cuida el planeta con cada compra. Optimiza tu lista de compras con
            inteligencia sostenible.
          </p>
          <div className="flex flex-wrap gap-3">
            <Button asChild size="lg" variant="secondary">
              <Link to="/search">
                <ShoppingBag className="mr-2 h-5 w-5" />
                Comenzar a comprar
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="border-white text-white hover:bg-white/20">
              <Link to="/lists">
                Ver mis listas
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
          </div>
        </div>
        <div className="absolute right-0 top-0 h-full w-1/3 opacity-20">
          <Leaf className="h-full w-full" />
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card className="p-6 space-y-2 hover:shadow-card-custom transition-shadow">
          <div className="flex items-center gap-2 text-accent">
            <TrendingDown className="h-5 w-5" />
            <p className="text-sm font-medium text-muted-foreground">Ahorro Total</p>
          </div>
          <p className="text-3xl font-bold text-accent">{formatCLP(stats.totalSavings)}</p>
          <p className="text-xs text-muted-foreground">En los últimos 30 días</p>
        </Card>

        <Card className="p-6 space-y-2 hover:shadow-card-custom transition-shadow">
          <div className="flex items-center gap-2 text-primary">
            <Leaf className="h-5 w-5" />
            <p className="text-sm font-medium text-muted-foreground">Score Eco</p>
          </div>
          <p className="text-3xl font-bold text-primary">{stats.avgEcoScore}/100</p>
          <p className="text-xs text-muted-foreground">Promedio de tus compras</p>
        </Card>

        <Card className="p-6 space-y-2 hover:shadow-card-custom transition-shadow">
          <div className="flex items-center gap-2 text-secondary">
            <Users className="h-5 w-5" />
            <p className="text-sm font-medium text-muted-foreground">Score Social</p>
          </div>
          <p className="text-3xl font-bold text-secondary">{stats.avgSocialScore}/100</p>
          <p className="text-xs text-muted-foreground">Impacto social positivo</p>
        </Card>

        <Card className="p-6 space-y-2 hover:shadow-card-custom transition-shadow">
          <div className="flex items-center gap-2 text-foreground">
            <ShoppingBag className="h-5 w-5" />
            <p className="text-sm font-medium text-muted-foreground">Listas Creadas</p>
          </div>
          <p className="text-3xl font-bold text-foreground">{stats.listsCount}</p>
          <p className="text-xs text-muted-foreground">Total de listas</p>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="space-y-4">
        <h2 className="text-2xl font-bold text-foreground">Acciones Rápidas</h2>
        <div className="grid gap-4 md:grid-cols-3">
          <Card className="p-6 space-y-3 hover:shadow-card-custom transition-all hover:border-primary cursor-pointer group">
            <Link to="/search" className="block space-y-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                <ShoppingBag className="h-6 w-6" />
              </div>
              <h3 className="font-semibold text-foreground">Buscar Productos</h3>
              <p className="text-sm text-muted-foreground">
                Encuentra productos por código de barras o nombre
              </p>
            </Link>
          </Card>

          <Card className="p-6 space-y-3 hover:shadow-card-custom transition-all hover:border-primary cursor-pointer group">
            <Link to="/lists" className="block space-y-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-accent/10 text-accent group-hover:bg-accent group-hover:text-accent-foreground transition-colors">
                <ListChecks className="h-6 w-6" />
              </div>
              <h3 className="font-semibold text-foreground">Optimizar Lista</h3>
              <p className="text-sm text-muted-foreground">
                Crea y optimiza tu lista de compras con IA
              </p>
            </Link>
          </Card>

          <Card className="p-6 space-y-3 hover:shadow-card-custom transition-all hover:border-primary cursor-pointer group">
            <Link to="/compare" className="block space-y-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-secondary/10 text-secondary group-hover:bg-secondary group-hover:text-secondary-foreground transition-colors">
                <GitCompare className="h-6 w-6" />
              </div>
              <h3 className="font-semibold text-foreground">Comparar Alternativas</h3>
              <p className="text-sm text-muted-foreground">
                Encuentra mejores opciones para tus productos
              </p>
            </Link>
          </Card>
        </div>
      </div>

      {/* Impact Summary */}
      <Card className="p-8 space-y-6">
        <div className="space-y-2">
          <h2 className="text-2xl font-bold text-foreground">Tu Impacto Este Mes</h2>
          <p className="text-muted-foreground">
            Cada decisión cuenta. Aquí está el resumen de tu contribución sostenible.
          </p>
        </div>
        
        <div className="space-y-4">
          <ScoreBar score={stats.avgEcoScore} label="Impacto Ambiental" type="eco" />
          <ScoreBar score={stats.avgSocialScore} label="Impacto Social" type="social" />
        </div>

        <div className="grid gap-4 md:grid-cols-3 pt-4 border-t">
          <div className="space-y-1">
            <p className="text-2xl font-bold text-primary">1.2 kg</p>
            <p className="text-sm text-muted-foreground">CO₂ ahorrado vs promedio</p>
          </div>
          <div className="space-y-1">
            <p className="text-2xl font-bold text-secondary">15%</p>
            <p className="text-sm text-muted-foreground">Productos locales elegidos</p>
          </div>
          <div className="space-y-1">
            <p className="text-2xl font-bold text-accent">{formatCLP(stats.totalSavings)}</p>
            <p className="text-sm text-muted-foreground">Ahorrado vs precio regular</p>
          </div>
        </div>
      </Card>
    </div>
  );
};
