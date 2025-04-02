'use client';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { useCountdown } from '@/context/countdownProvider';
import { useProfile } from '@/context/profileProvider';
import { formatDate } from '@/lib/utils';
import {
  Award,
  ArrowRight,
  Clock,
  Gift,
  Star,
  TrendingUp,
  Trophy,
  User,
  Wallet,
  Calendar,
  ExternalLink,
  HandCoins,
  Sparkles
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function AccountPage() {
  const { countdown, formatTime } = useCountdown();
  const { profile, user } = useProfile();
  const [isPageLoaded, setIsPageLoaded] = useState(false);
  const router = useRouter();
  const timeToNextTicket = countdown ? Math.floor(countdown / 60) % 60 : 0;

  // Statistiques de l'utilisateur
  const [userStats] = useState({
    totalWon: 2350,
    scratched: 48,
    biggestWin: 500,
    currentStreak: 7,
  });

  // Historique des gains récents
  const prizeHistory = [
    { date: '30/03/2025', amount: 75, name: 'Prix Argent' },
    { date: '29/03/2025', amount: 120, name: 'Prix Or' },
    { date: '28/03/2025', amount: 50, name: 'Prix Bronze' },
    { date: '27/03/2025', amount: 500, name: 'Prix Platine' },
    { date: '26/03/2025', amount: 25, name: 'Prix Bronze' },
  ];

  useEffect(() => {
    setIsPageLoaded(true);
  }, []);

  return (
    <div className="container mx-auto max-w-4xl py-10">
      {/* Profil utilisateur */}
      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-3xl font-bold">Mon Compte</h1>
        <div className="flex items-center gap-2 rounded-lg bg-slate-100 p-3">
          <HandCoins className="text-yellow-500" />
          <span className="font-semibold">{profile?.points} points</span>
        </div>
      </div>

      {/* En-tête de profil */}
      <div className="mb-8">
        <Card className="bg-white shadow-sm">
          <CardContent className="flex flex-col sm:flex-row items-center sm:items-center gap-4 p-4">
            <Avatar className="h-16 w-16 border-2 border-purple-200">
              <AvatarImage alt={profile?.full_name ?? ''} src={profile?.avatar_url ?? ''} />
              <AvatarFallback className="text-xl bg-purple-100 text-purple-700 uppercase">
                {profile?.full_name?.charAt(0) ?? user?.email?.charAt(0)}
              </AvatarFallback>
            </Avatar>
            
            <div className="flex-1 text-center sm:text-left">
              <h2 className="text-xl font-bold text-slate-800">
                {profile?.full_name ?? user?.email}
              </h2>
              
              <div className="flex items-center justify-center sm:justify-start gap-1 text-sm text-slate-500 mt-1">
                <User className="h-3 w-3" />
                <span>@{profile?.username ?? 'utilisateur'}</span>
              </div>
              
              <div className="mt-2 flex items-center justify-center sm:justify-start gap-2">
                <div className="flex items-center gap-1">
                  <Star className="h-4 w-4 text-amber-400" />
                  <span className="text-xs text-slate-500">Membre depuis: {formatDate(profile?.created_at ?? '').split(' ')[0]}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Statistiques principales */}
      <div className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Card className="bg-gradient-to-r from-green-50 to-green-100 transition-all hover:shadow-md">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-green-700">Total Gagné</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <TrendingUp className="text-green-500" />
              <span className="text-2xl font-bold">{userStats.totalWon}</span>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-purple-50 to-purple-100 transition-all hover:shadow-md">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-purple-700">Tickets Grattés</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Gift className="text-purple-500" />
              <span className="text-2xl font-bold">{userStats.scratched}</span>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-amber-50 to-amber-100 transition-all hover:shadow-md">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-amber-700">Plus Gros Gain</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Trophy className="text-amber-500" />
              <span className="text-2xl font-bold">{userStats.biggestWin}</span>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-blue-50 to-blue-100 transition-all hover:shadow-md">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-blue-700">Série Actuelle</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Award className="text-blue-500" />
              <span className="text-2xl font-bold">{userStats.currentStreak} j</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Section principal et gains récents */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {/* Ticket disponible */}
        <Card className="transition-all hover:shadow-md">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Ticket gratuit</CardTitle>
                <CardDescription>
                  Récupérez votre ticket gratuit
                </CardDescription>
              </div>
              {countdown !== null && countdown > 0 && (
                <Badge className="flex items-center gap-1" variant="outline">
                  <Clock size={14} />
                  {formatTime(countdown)}
                </Badge>
              )}
            </div>
          </CardHeader>
          
          <CardContent>
            <Progress className="mb-3 h-2" value={((60 - timeToNextTicket) / 60) * 100} />
            
            <div className="flex flex-col items-center justify-center p-2">
              {countdown !== null && countdown > 0 ? (
                <div className="w-full text-center">
                  <div className="rounded-lg bg-slate-50 p-4 text-center">
                    <p className="text-slate-600 mb-2 text-sm">
                      Disponible dans:
                    </p>
                    <div className="text-xl font-bold text-slate-800 mb-2">
                      {formatTime(countdown)}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="w-full text-center">
                  <Gift className="mx-auto h-10 w-10 mb-3 text-purple-500" />
                  <p className="text-slate-600 mb-3 text-sm">
                    Votre ticket gratuit est disponible!
                  </p>
                </div>
              )}
            </div>
          </CardContent>
          
          <CardFooter>
            <Button
              className="w-full"
              disabled={timeToNextTicket > 0}
              variant={timeToNextTicket > 0 ? 'outline' : 'default'}
              onClick={() => {
                if (timeToNextTicket <= 0) {
                  router.push('/ticket-gratuit');
                }
              }}
            >
              {timeToNextTicket > 0 ? 'Disponible bientôt' : 'Récupérer ticket gratuit'}
            </Button>
          </CardFooter>
        </Card>

        {/* Historique des gains */}
        <Card className="transition-all hover:shadow-md">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Gains Récents</CardTitle>
                <CardDescription>Vos 5 derniers prix</CardDescription>
              </div>
              <Sparkles className="h-5 w-5 text-amber-500" />
            </div>
          </CardHeader>
          
          <CardContent>
            <ul className="divide-y">
              {prizeHistory.map((item, index) => (
                <li
                  key={index}
                  className="py-2 flex items-center justify-between"
                >
                  <div>
                    <p className="font-medium text-slate-800">{item.name}</p>
                    <p className="text-xs text-slate-500">{item.date}</p>
                  </div>
                  <Badge className="bg-purple-100 text-purple-700">
                    {item.amount} pts
                  </Badge>
                </li>
              ))}
            </ul>
          </CardContent>
          
          <CardFooter>
            <Button className="w-full" variant="outline">
              <ExternalLink className="mr-2 h-4 w-4" />
              Voir Tout l'Historique
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}