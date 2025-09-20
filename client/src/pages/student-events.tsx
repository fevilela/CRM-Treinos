import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { format, isToday, isTomorrow, isThisWeek, startOfDay } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, MapPin, User, AlertCircle } from "lucide-react";
import type { Student } from "@shared/schema";

interface CalendarEvent {
  id: string;
  title: string;
  startTime: string;
  endTime: string;
  description?: string;
  type: string;
  location?: string;
  personalTrainerId: string;
}

interface StudentEventsProps {
  student: Student;
}

const eventTypeConfig = {
  training: {
    label: "Treino",
    color: "bg-blue-100 text-blue-800",
    icon: "fas fa-dumbbell",
  },
  consultation: {
    label: "Consulta",
    color: "bg-green-100 text-green-800",
    icon: "fas fa-user-md",
  },
  assessment: {
    label: "Avaliação",
    color: "bg-purple-100 text-purple-800",
    icon: "fas fa-clipboard-check",
  },
  personal: {
    label: "Pessoal",
    color: "bg-gray-100 text-gray-800",
    icon: "fas fa-calendar",
  },
};

function getEventTimeLabel(startTime: Date) {
  if (isToday(startTime)) {
    return "Hoje";
  } else if (isTomorrow(startTime)) {
    return "Amanhã";
  } else if (isThisWeek(startTime)) {
    return format(startTime, "eeee", { locale: ptBR });
  } else {
    return format(startTime, "dd/MM/yyyy", { locale: ptBR });
  }
}

function EventCard({ event }: { event: CalendarEvent }) {
  const startTime = new Date(event.startTime);
  const endTime = new Date(event.endTime);
  const config =
    eventTypeConfig[event.type as keyof typeof eventTypeConfig] ||
    eventTypeConfig.personal;

  return (
    <Card className="mb-4 hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <i className={`${config.icon} text-primary`}></i>
              <h3 className="font-semibold text-gray-900">{event.title}</h3>
              <Badge className={config.color}>{config.label}</Badge>
            </div>

            <div className="space-y-1 text-sm text-gray-600">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                <span>{getEventTimeLabel(startTime)}</span>
              </div>

              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4" />
                <span>
                  {format(startTime, "HH:mm")} - {format(endTime, "HH:mm")}
                </span>
              </div>

              {event.location && (
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4" />
                  <span>{event.location}</span>
                </div>
              )}
            </div>

            {event.description && (
              <p className="mt-2 text-sm text-gray-700">{event.description}</p>
            )}
          </div>

          <div className="text-right">
            <span className="text-xs text-gray-500">
              {format(startTime, "dd/MM")}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function StudentEvents({ student }: StudentEventsProps) {
  const [groupedEvents, setGroupedEvents] = useState<{
    today: CalendarEvent[];
    upcoming: CalendarEvent[];
    later: CalendarEvent[];
  }>({
    today: [],
    upcoming: [],
    later: [],
  });

  const {
    data: events = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: ["student-events", student.id],
    queryFn: async () => {
      const response = await fetch(
        `/api/calendar/events/student/${student.id}`,
        {
          credentials: "include",
        }
      );
      if (!response.ok) {
        throw new Error("Failed to fetch events");
      }
      return response.json();
    },
  });

  useEffect(() => {
    if (events.length > 0) {
      const now = new Date();
      const today = startOfDay(now);
      const todayEvents: CalendarEvent[] = [];
      const upcomingEvents: CalendarEvent[] = [];
      const laterEvents: CalendarEvent[] = [];

      events.forEach((event: CalendarEvent) => {
        const eventStart = new Date(event.startTime);

        if (isToday(eventStart)) {
          todayEvents.push(event);
        } else if (isTomorrow(eventStart) || isThisWeek(eventStart)) {
          upcomingEvents.push(event);
        } else {
          laterEvents.push(event);
        }
      });

      // Sort events by start time
      const sortByTime = (a: CalendarEvent, b: CalendarEvent) =>
        new Date(a.startTime).getTime() - new Date(b.startTime).getTime();

      setGroupedEvents({
        today: todayEvents.sort(sortByTime),
        upcoming: upcomingEvents.sort(sortByTime),
        later: laterEvents.sort(sortByTime),
      });
    }
  }, [events]);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">Meus Eventos</h1>
        </div>
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-gray-600">Carregando eventos...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">Meus Eventos</h1>
        </div>
        <Card>
          <CardContent className="p-6 text-center">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Erro ao carregar eventos
            </h3>
            <p className="text-gray-600">
              Não foi possível carregar seus eventos. Tente novamente mais
              tarde.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const hasEvents = events.length > 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Meus Eventos</h1>
        <div className="text-sm text-gray-600">
          {hasEvents
            ? `${events.length} evento(s) agendado(s)`
            : "Nenhum evento"}
        </div>
      </div>

      {!hasEvents ? (
        <Card>
          <CardContent className="p-8 text-center">
            <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Nenhum evento agendado
            </h3>
            <p className="text-gray-600">
              Você não possui eventos agendados no momento. Seus treinos e
              consultas aparecerão aqui quando forem marcados pelo seu personal
              trainer.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {/* Eventos de hoje */}
          {groupedEvents.today.length > 0 && (
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                Hoje
              </h2>
              <div className="space-y-2">
                {groupedEvents.today.map((event) => (
                  <EventCard key={event.id} event={event} />
                ))}
              </div>
            </div>
          )}

          {/* Eventos próximos */}
          {groupedEvents.upcoming.length > 0 && (
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                Próximos
              </h2>
              <div className="space-y-2">
                {groupedEvents.upcoming.map((event) => (
                  <EventCard key={event.id} event={event} />
                ))}
              </div>
            </div>
          )}

          {/* Eventos futuros */}
          {groupedEvents.later.length > 0 && (
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <div className="w-3 h-3 bg-gray-400 rounded-full"></div>
                Mais tarde
              </h2>
              <div className="space-y-2">
                {groupedEvents.later.map((event) => (
                  <EventCard key={event.id} event={event} />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
