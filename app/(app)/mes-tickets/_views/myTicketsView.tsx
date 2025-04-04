'use client';
import { ScratchToReveal } from '@/components/magicui/scratch-to-reveal';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { useCountdown } from '@/context/countdownProvider';
import { useMyTickets } from '@/context/myTicketsProvider';
import { TicketWithPrize } from '@/types/types';
import {
  Calendar,
  Clock,
  Filter,
  Gift,
  HandCoins,
  Loader2,
  Search,
  Sparkles,
  Ticket,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { PremiumTicket, premiumTickets } from '@/data/tickets';
import { useProfile } from '@/context/profileProvider';

export default function MyTicketsView() {
  // États et hooks
  const { tickets, loading, refreshTickets } = useMyTickets();
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all'); // 'all', 'revealed', 'unrevealed'
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [revealLoadingId, setRevealLoadingId] = useState<number | null>(null);
  const [revealedTicket, setRevealedTicket] = useState<TicketWithPrize | null>(null);
  const [error, setError] = useState('');
  const [revealed, setRevealed] = useState(false);
  const [scratchKey, setScratchKey] = useState(0); // Clé unique pour forcer le re-rendu du composant ScratchToReveal
  const { countdown, formatTime } = useCountdown();
  const { profile } = useProfile();

  // Réinitialiser l'état revealed quand le modal est fermé
  useEffect(() => {
    if (!isModalOpen) {
      setRevealed(false);
      setScratchKey((prev) => prev + 1); // Incrémenter la clé pour forcer le re-rendu
    }
  }, [isModalOpen]);

  // Fonction pour extraire le nom de catégorie (Argent, Or, Platine, Mystère) à partir du nom du prix
  const getCategoryFromPrizeName = (prizeName: string): string => {
    if (prizeName.includes('Argent')) return 'Argent';
    if (prizeName.includes('Or')) return 'Or';
    if (prizeName.includes('Platine')) return 'Platine';
    if (prizeName.includes('Mystère')) return 'Mystère';
    return 'Argent'; // Valeur par défaut
  };

  // Fonction corrigée pour obtenir le style de ticket
  const getTicketStyle = (id: string | number, isRevealed: boolean, ticket: TicketWithPrize) => {
    let categoryName: string;

    // Déterminer la catégorie du ticket
    if (isRevealed) {
      // Pour les tickets révélés, utiliser la catégorie du prix
      categoryName = ticket.prize.prize_category
        ? typeof ticket.prize.prize_category === 'string'
          ? ticket.prize.prize_category
          : premiumTickets.find((t) => t.id === ticket.prize.prize_category)?.name || 'Argent'
        : getCategoryFromPrizeName(ticket.prize.prize_name);
    } else {
      // Pour les tickets non révélés, utiliser directement le nom de la catégorie
      categoryName = getCategoryFromPrizeName(ticket.prize.prize_name);
    }

    // Trouver le ticket correspondant au nom de la catégorie
    const ticketStyle = premiumTickets.find((t) => t.name === categoryName) || premiumTickets[0];

    // Mapper les couleurs de fond des boutons
    const buttonBgMap = {
      'bg-slate-100': 'bg-slate-600 hover:bg-slate-700',
      'bg-amber-100': 'bg-amber-600 hover:bg-amber-700',
      'bg-cyan-100': 'bg-cyan-600 hover:bg-cyan-700',
      'bg-purple-100': 'bg-purple-600 hover:bg-purple-700',
    };

    const buttonBg =
      buttonBgMap[ticketStyle.color as keyof typeof buttonBgMap] ||
      'bg-slate-600 hover:bg-slate-700';

    return {
      color: ticketStyle.color,
      textColor: ticketStyle.textColor,
      buttonBg: buttonBg,
      name: ticketStyle.name,
    };
  };

  const getFilteredTickets = () => {
    if (!tickets) return [];

    return tickets
      .filter((ticket) => {
        const matchesSearch = ticket.is_revealed
          ? ticket.prize.prize_name.toLowerCase().includes(search.toLowerCase())
          : 'Non révélé'.toLowerCase().includes(search.toLowerCase());

        const matchesFilter =
          filter === 'all' ||
          (filter === 'revealed' && ticket.is_revealed) ||
          (filter === 'unrevealed' && !ticket.is_revealed);

        return matchesSearch && matchesFilter;
      })
      .sort((a, b) => {
        if (a.is_revealed !== b.is_revealed) {
          return a.is_revealed ? 1 : -1;
        }
        return new Date(b.attempted_at || '').getTime() - new Date(a.attempted_at || '').getTime();
      });
  };

  const filteredTickets = getFilteredTickets();

  const getTicketStats = () => {
    const totalTickets = tickets?.length || 0;
    const revealedTickets = tickets?.filter((t) => t.is_revealed).length || 0;
    const unrevealedTickets = totalTickets - revealedTickets;
    const totalValue =
      tickets
        ?.filter((t) => t.is_revealed)
        .reduce((sum, ticket) => sum + (ticket.prize.prize_amount || 0), 0) || 0;

    return { totalTickets, revealedTickets, unrevealedTickets, totalValue };
  };

  const { totalTickets, revealedTickets, unrevealedTickets, totalValue } = getTicketStats();

  const formatDate = (dateString: string | null | undefined): string => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handleRevealTicket = async (ticketId: number) => {
    try {
      setRevealLoadingId(ticketId);
      setError('');

      const response = await fetch(`/api/prize/reveal`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ attemptId: ticketId }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Erreur lors de la révélation du ticket');
      }

      // Trouver le ticket et le définir comme révélé
      const ticket = tickets?.find((t) => t.id === ticketId);
      if (ticket) {
        setRevealedTicket(ticket);
        setIsModalOpen(true);
        // Réinitialiser l'état revealed et incrémenter la clé pour forcer le re-rendu
        setRevealed(false);
        setScratchKey((prev) => prev + 1);
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Une erreur est survenue lors de la révélation du ticket',
      );
      console.error('Erreur de révélation:', err);
    } finally {
      setRevealLoadingId(null);
    }
  };

  const handleScratchComplete = () => {
    refreshTickets();
    setRevealed(true);
  };

  const getScratchGradientColors = (ticketName: string): [string, string, string] => {
    const gradientMap: Record<string, [string, string, string]> = {
      Argent: ['#CBD5E1', '#94A3B8', '#E2E8F0'],
      Or: ['#FDE68A', '#F59E0B', '#FBBF24'],
      Platine: ['#67E8F9', '#06B6D4', '#22D3EE'],
      Mystère: ['#C4B5FD', '#8B5CF6', '#A78BFA'],
    };

    return gradientMap[ticketName as keyof typeof gradientMap] || ['#A97CF8', '#F38CB8', '#FDCC92'];
  };

  if (loading) {
    return (
      <div className="container mx-auto max-w-7xl py-10">
        <div className="mb-8 flex items-center justify-between">
          <Skeleton className="h-10 w-48" />
          <Skeleton className="h-12 w-32" />
        </div>

        <div className="mb-6 flex items-center gap-4">
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-10 w-32" />
        </div>

        <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-24 w-full rounded-xl" />
          ))}
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Skeleton key={i} className="h-64 w-full rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-7xl py-10">
      <div className="mb-8 flex flex-col items-start justify-between gap-6 md:flex-row md:items-center">
        <div>
          <h1 className="text-3xl font-bold text-slate-800">Mes Tickets</h1>
          <p className="mt-2 text-slate-500">Retrouvez tous vos tickets et suivez vos gains</p>
        </div>
        <div className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-amber-50 to-yellow-100 p-3 shadow-sm">
          <HandCoins className="text-amber-500" />
          <span className="font-semibold text-amber-700">{profile?.points.toFixed(0)} points</span>
        </div>
      </div>

      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-4">
        <StatCard
          color={premiumTickets[0].color}
          icon={<Ticket className={premiumTickets[0].textColor} />}
          textColor={premiumTickets[0].textColor}
          title="Total tickets"
          value={totalTickets}
        />

        <StatCard
          color={premiumTickets[2].color}
          icon={<Gift className={premiumTickets[2].textColor} />}
          textColor={premiumTickets[2].textColor}
          title="Tickets révélés"
          value={revealedTickets}
        />

        <StatCard
          color={premiumTickets[1].color}
          icon={<Sparkles className={premiumTickets[1].textColor} />}
          textColor={premiumTickets[1].textColor}
          title="À révéler"
          value={unrevealedTickets}
        />

        <StatCard
          color={premiumTickets[3].color}
          icon={<Clock className={premiumTickets[3].textColor} />}
          textColor={premiumTickets[3].textColor}
          title="Prochain ticket"
          value={countdown !== null ? formatTime(countdown) : '--:--:--'}
          isValueString
        />
      </div>

      <div className="mb-8 flex flex-col gap-4 rounded-xl bg-slate-50 p-6 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div className="relative max-w-xs">
          <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input
            className="bg-white pl-10"
            placeholder="Rechercher un ticket..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="flex items-center gap-3">
          <span className="text-sm text-slate-500">Filtrer par:</span>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button className="gap-2" variant="outline">
                <Filter className="h-4 w-4" />
                {filter === 'all' && 'Tous les tickets'}
                {filter === 'revealed' && 'Tickets révélés'}
                {filter === 'unrevealed' && 'Tickets non révélés'}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => setFilter('all')}>Tous les tickets</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setFilter('revealed')}>
                Tickets révélés
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setFilter('unrevealed')}>
                Tickets non révélés
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3">
        {filteredTickets.length === 0 ? (
          <EmptyTicketsState
            hasFilters={search !== '' || filter !== 'all'}
            onResetFilters={() => {
              setSearch('');
              setFilter('all');
            }}
          />
        ) : (
          filteredTickets.map((ticket) => {
            // Utiliser directement le ticket pour obtenir le style
            const ticketStyle = getTicketStyle(ticket.id, ticket.is_revealed, ticket);

            return (
              <TicketCard
                key={ticket.id}
                formatDate={formatDate}
                isRevealing={revealLoadingId === ticket.id}
                ticket={ticket}
                ticketStyle={ticketStyle}
                onReveal={() => handleRevealTicket(ticket.id)}
              />
            );
          })
        )}
      </div>
      <Dialog
        open={isModalOpen}
        onOpenChange={(open) => {
          if (!open) {
            setRevealed(false);
            setRevealedTicket(null);
            setScratchKey((prev) => prev + 1);
          }
          setIsModalOpen(open);
        }}
      >
        {revealedTicket &&
          (() => {
            // Utiliser directement le ticket pour obtenir le style
            const ticketStyle = getTicketStyle(
              revealedTicket.id,
              revealedTicket.is_revealed,
              revealedTicket,
            );

            const gradientColors = getScratchGradientColors(ticketStyle.name);

            return (
              <DialogContent
                className={`border-4 sm:max-w-[600px] ${ticketStyle.color.replace('bg-', 'border-')} ${ticketStyle.color} shadow-xl`}
              >
                <DialogHeader className={ticketStyle.color}>
                  <DialogTitle
                    className={`text-center text-2xl font-bold ${ticketStyle.textColor}`}
                  >
                    {revealed
                      ? revealedTicket.prize.prize_name
                      : `Ticket ${getCategoryFromPrizeName(revealedTicket.prize.prize_name)}`}
                  </DialogTitle>
                  <DialogDescription
                    className={`text-center font-medium ${ticketStyle.textColor.replace('text-', 'text-opacity-80 text-')}`}
                  >
                    {revealed
                      ? 'Félicitations pour votre gain !'
                      : 'Grattez pour découvrir votre gain !'}
                  </DialogDescription>
                </DialogHeader>

                <div className="flex justify-center p-4">
                  {/* Ajouter la clé pour forcer le re-rendu */}
                  <ScratchToReveal
                    key={scratchKey}
                    className={`flex items-center justify-center overflow-hidden rounded-2xl ${ticketStyle.color} shadow-lg`}
                    gradientColors={gradientColors}
                    height={300}
                    minScratchPercentage={25}
                    width={300}
                    onComplete={handleScratchComplete}
                  >
                    <div className="flex h-full w-full flex-col items-center justify-center bg-white p-4 text-center">
                      <div className={`mb-2 inline-block rounded-full p-3 ${ticketStyle.color}`}>
                        <Sparkles className={`h-8 w-8 ${ticketStyle.textColor}`} />
                      </div>
                      <h2 className="mb-1 text-2xl font-bold text-slate-800">Félicitations !</h2>
                      <div className={`mt-2 mb-1 text-4xl font-bold ${ticketStyle.textColor}`}>
                        {revealedTicket.prize.prize_amount.toFixed(2)} points
                      </div>
                      <p className="text-md text-slate-600">{revealedTicket.prize.prize_name}</p>
                      {revealed && (
                        <Button
                          className={`mt-4 ${ticketStyle.buttonBg}`}
                          onClick={() => {
                            setIsModalOpen(false);
                            setRevealed(false);
                            setRevealedTicket(null);
                            setScratchKey((prev) => prev + 1);
                          }}
                        >
                          Collecter
                        </Button>
                      )}
                    </div>
                  </ScratchToReveal>
                </div>

                <div className="mt-4 text-center">
                  <p className={`text-sm ${ticketStyle.textColor}`}>
                    {revealed
                      ? 'Vos points ont été ajoutés à votre compte'
                      : 'Grattez la carte avec votre doigt ou votre souris'}
                  </p>
                </div>
              </DialogContent>
            );
          })()}

        {error && (
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="text-center text-2xl text-red-600">
                Erreur de révélation
              </DialogTitle>
            </DialogHeader>
            <div className="text-center text-red-500">
              <p>{error}</p>
              <Button
                className="mt-4"
                variant="outline"
                onClick={() => {
                  setIsModalOpen(false);
                  setError('');
                }}
              >
                Fermer
              </Button>
            </div>
          </DialogContent>
        )}
      </Dialog>
    </div>
  );
}

interface StatCardProps {
  title: string;
  value: number | string;
  icon: React.ReactNode;
  color: string;
  textColor: string;
  isValueString?: boolean;
}

function StatCard({ title, value, icon, color, textColor, isValueString = false }: StatCardProps) {
  return (
    <Card className={`${color} shadow-md transition-all hover:shadow-lg`}>
      <CardHeader className="pb-2">
        <CardTitle className={`text-sm font-medium ${textColor}`}>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-2">
          {icon}
          <span className={`text-2xl font-bold ${textColor}`}>{value}</span>
        </div>
      </CardContent>
    </Card>
  );
}

interface EmptyTicketsStateProps {
  hasFilters: boolean;
  onResetFilters: () => void;
}

function EmptyTicketsState({ hasFilters, onResetFilters }: EmptyTicketsStateProps) {
  return (
    <div className="col-span-full flex flex-col items-center justify-center py-16 text-center">
      <div className="rounded-full bg-slate-100 p-6">
        <HandCoins className="h-12 w-12 text-slate-400" />
      </div>
      <p className="mt-6 text-xl font-semibold text-slate-700">Aucun ticket trouvé</p>
      <p className="mt-2 text-sm text-slate-500">
        {hasFilters
          ? 'Essayez de modifier vos critères de recherche ou de filtre'
          : 'Commencez par obtenir des tickets gratuits ou premium'}
      </p>
      {hasFilters && (
        <Button className="mt-4" variant="outline" onClick={onResetFilters}>
          Réinitialiser les filtres
        </Button>
      )}
    </div>
  );
}

interface TicketCardProps {
  ticket: TicketWithPrize;
  ticketStyle: {
    color: string;
    textColor: string;
    buttonBg: string;
    name: string;
  };
  formatDate: (date: string | null | undefined) => string;
  isRevealing: boolean;
  onReveal: () => void;
}

function TicketCard({ ticket, ticketStyle, formatDate, isRevealing, onReveal }: TicketCardProps) {
  return (
    <Card
      className={`${ticketStyle.color} transition-all hover:translate-y-[-4px] hover:shadow-lg`}
    >
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className={`${ticketStyle.textColor} text-xl`}>
            {ticket.is_revealed ? ticket.prize.prize_name : `Ticket ${ticketStyle.name}`}
          </CardTitle>
          <Badge
            className={
              ticket.is_revealed
                ? `bg-green-100 text-green-700`
                : `${ticketStyle.color.replace('bg-', 'bg-opacity-80 bg-')} ${ticketStyle.textColor}`
            }
          >
            {ticket.is_revealed ? 'Révélé' : 'À gratter'}
          </Badge>
        </div>
      </CardHeader>

      <CardContent>
        {ticket.is_revealed ? (
          <RevealedTicketContent
            formatDate={formatDate}
            ticket={ticket}
            ticketStyle={ticketStyle}
          />
        ) : (
          <UnrevealedTicketContent ticketStyle={ticketStyle} />
        )}
      </CardContent>

      <CardFooter className="flex justify-center">
        {!ticket.is_revealed && (
          <Button
            className={`w-full ${ticketStyle.buttonBg}`}
            disabled={isRevealing}
            variant="default"
            onClick={onReveal}
          >
            {isRevealing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Révélation en cours...
              </>
            ) : (
              'Révéler maintenant'
            )}
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}

interface RevealedTicketContentProps {
  ticket: TicketWithPrize;
  ticketStyle: {
    color: string;
    textColor: string;
    buttonBg: string;
    name: string;
  };
  formatDate: (date: string | null | undefined) => string;
}

function RevealedTicketContent({ ticket, ticketStyle, formatDate }: RevealedTicketContentProps) {
  return (
    <div className="flex flex-col gap-2">
      <div
        className={`flex items-center justify-center gap-2 rounded-lg ${ticketStyle.color.replace('bg-', 'bg-opacity-80 bg-')} p-4 text-xl font-bold ${ticketStyle.textColor}`}
      >
        <Sparkles className="h-5 w-5" />
        <span>{ticket.prize.prize_amount.toFixed(2)} points</span>
      </div>
      <div className="mt-2 flex items-center justify-between text-xs text-slate-600">
        <div className="flex items-center gap-1">
          <Calendar className="h-3 w-3" />
          <span>{formatDate(ticket.attempted_at)}</span>
        </div>
        <div className="flex items-center gap-1">
          <Ticket className="h-3 w-3" />
          <span>ID: {ticket.id.toString().substring(0, 8)}</span>
        </div>
      </div>
    </div>
  );
}

interface UnrevealedTicketContentProps {
  ticketStyle: {
    color: string;
    textColor: string;
    buttonBg: string;
    name: string;
  };
}

function UnrevealedTicketContent({ ticketStyle }: UnrevealedTicketContentProps) {
  return (
    <div className="flex flex-col items-center gap-3 py-4">
      <div className={`rounded-full ${ticketStyle.color.replace('bg-', 'bg-opacity-80 bg-')} p-4`}>
        <Gift className={`h-8 w-8 ${ticketStyle.textColor} animate-pulse`} />
      </div>
      <p className={`text-center text-sm ${ticketStyle.textColor}`}>
        Ce ticket contient une surprise !<br />
        Révélez-le pour voir votre gain.
      </p>
    </div>
  );
}
