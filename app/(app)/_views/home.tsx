'use client';

import HowItWorks from '@/components/HowItWorks';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { useCountdown } from '@/context/countdownProvider';
import { Clock, Gift, HandCoins, Sparkles } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Profile } from '@/types/types';
import { useProfile } from '@/context/profileProvider';
import { premiumTickets } from '@/data/tickets';

export default function HomeView({ user }: { user: Profile }) {
  const { countdown, formatTime } = useCountdown();
  const router = useRouter();
  const timeToNextTicket = countdown ? Math.floor(countdown / 60) % 60 : 100;
  const { profile, loading } = useProfile();

  const userPoints = profile?.points;

  if (loading) {
    return (
      <div className="container mx-auto max-w-4xl py-10">
        <div className="mb-8 flex items-center justify-between">
          <Skeleton className="h-10 w-48" />
          <Skeleton className="h-12 w-32" />
        </div>

        <div className="mb-8 rounded-xl bg-slate-50 p-6">
          <Skeleton className="mb-4 h-6 w-36" />
          <Skeleton className="mb-3 h-4 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>

        <div className="mt-6">
          <div className="m-4">
            <Skeleton className="mb-2 h-8 w-48" />
            <Skeleton className="h-4 w-96" />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
            {[1, 2, 3, 4].map((i) => (
              <Card key={i} className="bg-slate-50">
                <CardHeader>
                  <Skeleton className="h-6 w-24" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="mb-2 h-8 w-full" />
                  <Skeleton className="h-4 w-full" />
                </CardContent>
                <CardFooter>
                  <Skeleton className="h-10 w-full" />
                </CardFooter>
              </Card>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-4xl py-10">
      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-3xl font-bold">Tickets à Gratter</h1>
        <div className="flex items-center gap-2 rounded-lg bg-slate-100 p-3">
          <HandCoins className="text-yellow-500" />
          <span className="font-semibold">{userPoints} points</span>
        </div>
      </div>

      <div className="mb-8 rounded-xl bg-slate-50 p-6">
        <div className="mb-2 flex items-center justify-between">
          <h2 className="flex items-center gap-2 text-xl font-semibold">
            <Gift className="text-green-500" />
            Ticket gratuit
          </h2>
          {countdown !== null && countdown > 0 && (
            <Badge className="flex items-center gap-1" variant="outline">
              <Clock size={14} />
              {formatTime(countdown)}
            </Badge>
          )}
        </div>
        <p className="mb-3 text-sm text-slate-600">
          Vous avez droit à un ticket basique gratuit toutes les heures
        </p>
        <Progress className="mb-3 h-2" value={((60 - timeToNextTicket) / 60) * 100} />
        <Button
          className="mt-2 w-full"
          disabled={timeToNextTicket > 0}
          variant={timeToNextTicket > 0 ? 'outline' : 'default'}
          onClick={() => {
            if (timeToNextTicket <= 0) {
              router.push('/cashprize');
            }
          }}
        >
          {timeToNextTicket > 0 ? 'Disponible bientôt' : 'Récupérer ticket gratuit'}
        </Button>
      </div>

      <div className="mt-6">
        <div className="m-4 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">Tickets Premium</h2>
            <p className="text-muted-foreground">
              Utilisez vos points pour acheter des tickets premium avec des récompenses plus élevées
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
          {premiumTickets.map((ticket, index) => (
            <Card key={index} className={`${ticket.color} transition-all hover:shadow-lg`}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className={`${ticket.textColor} text-xl`}>{ticket.name}</CardTitle>
                  <Sparkles className={`${ticket.textColor} h-5 w-5`} />
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col gap-2">
                  <div
                    className={`text-xl font-bold ${ticket.textColor} flex items-center justify-center gap-2`}
                  >
                    {ticket.price} points
                  </div>
                  <p className="mt-2 text-center text-sm">
                    Gagnez entre {ticket.minReward} et {ticket.maxReward} points
                  </p>
                </div>
              </CardContent>
              <CardFooter className="flex justify-center">
                <Button
                  className="w-full"
                  disabled={(userPoints ?? 0) < ticket.price}
                  variant="default"
                >
                  {(userPoints ?? 0) >= ticket.price ? 'Acheter & Gratter' : 'Points insuffisants'}
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>

      <HowItWorks />
    </div>
  );
}
