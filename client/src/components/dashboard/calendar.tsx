import React, { useState, useCallback, useMemo, useEffect } from "react";
import {
  Calendar,
  momentLocalizer,
  Views,
  Event as BigCalendarEvent,
  View,
} from "react-big-calendar";
import moment from "moment";
import "react-big-calendar/lib/css/react-big-calendar.css";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Calendar as CalendarIcon,
  Plus,
  Settings,
  RefreshCw,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

// Configure moment localizer
const localizer = momentLocalizer(moment);

// Configure Portuguese locale
moment.locale("pt-br");

interface CalendarEvent extends BigCalendarEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  description?: string;
  type: "training" | "consultation" | "personal" | "synced";
  studentId?: string;
  studentName?: string;
  source?: "google" | "outlook" | "manual";
}

interface TeacherCalendarProps {
  className?: string;
}

export default function TeacherCalendar({ className }: TeacherCalendarProps) {
  const { toast } = useToast();
  const [view, setView] = useState<View>(Views.WEEK);
  const [date, setDate] = useState(new Date());
  const [showEventModal, setShowEventModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(
    null
  );
  const [isLoading, setIsLoading] = useState(false);

  // Mock events - later will be replaced with real data from APIs
  const [events, setEvents] = useState<CalendarEvent[]>([
    {
      id: "1",
      title: "Treino - João Silva",
      start: new Date(2025, 0, 20, 9, 0),
      end: new Date(2025, 0, 20, 10, 0),
      description: "Treino de peito e tríceps",
      type: "training",
      studentId: "1",
      studentName: "João Silva",
      source: "manual",
    },
    {
      id: "2",
      title: "Consulta Inicial - Maria Santos",
      start: new Date(2025, 0, 21, 14, 0),
      end: new Date(2025, 0, 21, 15, 0),
      description: "Avaliação física e definição de objetivos",
      type: "consultation",
      studentId: "2",
      studentName: "Maria Santos",
      source: "manual",
    },
    {
      id: "3",
      title: "Reunião Gerencial",
      start: new Date(2025, 0, 22, 16, 0),
      end: new Date(2025, 0, 22, 17, 0),
      description: "Reunião mensal de planejamento",
      type: "personal",
      source: "google",
    },
  ]);

  const [newEvent, setNewEvent] = useState({
    title: "",
    start: "",
    end: "",
    description: "",
    type: "training" as CalendarEvent["type"],
    studentId: "",
  });

  // Calendar configuration
  const { defaultDate, views } = useMemo(
    () => ({
      defaultDate: new Date(),
      views: {
        month: true,
        week: true,
        day: true,
        agenda: true,
      },
    }),
    []
  );

  // Event style getter
  const eventStyleGetter = useCallback((event: CalendarEvent) => {
    let backgroundColor = "#3174ad";
    let color = "white";

    switch (event.type) {
      case "training":
        backgroundColor = "#10b981"; // green
        break;
      case "consultation":
        backgroundColor = "#f59e0b"; // amber
        break;
      case "personal":
        backgroundColor = "#6366f1"; // indigo
        break;
      case "synced":
        backgroundColor = "#8b5cf6"; // purple
        break;
    }

    if (event.source === "google") {
      backgroundColor = "#4285f4"; // Google blue
    } else if (event.source === "outlook") {
      backgroundColor = "#0078d4"; // Outlook blue
    }

    return {
      style: {
        backgroundColor,
        color,
        border: "none",
        borderRadius: "4px",
        fontSize: "12px",
        padding: "2px 6px",
      },
    };
  }, []);

  // Handle event selection
  const handleSelectEvent = useCallback((event: CalendarEvent) => {
    setSelectedEvent(event);
    setShowEventModal(true);
  }, []);

  // Handle slot selection (create new event)
  const handleSelectSlot = useCallback(
    ({ start, end }: { start: Date; end: Date }) => {
      setNewEvent({
        title: "",
        start: moment(start).format("YYYY-MM-DDTHH:mm"),
        end: moment(end).format("YYYY-MM-DDTHH:mm"),
        description: "",
        type: "training",
        studentId: "",
      });
      setSelectedEvent(null);
      setShowEventModal(true);
    },
    []
  );

  // Create new event
  const handleCreateEvent = async () => {
    if (!newEvent.title || !newEvent.start || !newEvent.end) {
      toast({
        title: "Erro",
        description: "Preencha todos os campos obrigatórios",
        variant: "destructive",
      });
      return;
    }

    const event: CalendarEvent = {
      id: Date.now().toString(),
      title: newEvent.title,
      start: new Date(newEvent.start),
      end: new Date(newEvent.end),
      description: newEvent.description,
      type: newEvent.type,
      studentId: newEvent.studentId || undefined,
      source: "manual",
    };

    setEvents((prev) => [...prev, event]);
    setShowEventModal(false);

    toast({
      title: "Sucesso",
      description: "Evento criado com sucesso",
    });
  };

  // Estados para conexões de calendários
  const [calendarConnections, setCalendarConnections] = useState({
    google: { connected: false, loading: false },
    outlook: { connected: false, loading: false },
  });

  // Verificar status das conexões ao carregar
  useEffect(() => {
    checkCalendarStatus();
  }, []);

  // Verificar status das conexões de calendários
  const checkCalendarStatus = async () => {
    try {
      const response = await fetch("/api/calendar/status", {
        credentials: "include",
      });

      if (response.ok) {
        const data = await response.json();
        setCalendarConnections({
          google: {
            connected: data.connections.google.connected,
            loading: false,
          },
          outlook: {
            connected: data.connections.outlook.connected,
            loading: false,
          },
        });
      }
    } catch (error) {
      console.error("Erro ao verificar status dos calendários:", error);
    }
  };

  // Conectar com Google Calendar
  const handleConnectGoogle = async () => {
    setCalendarConnections((prev) => ({
      ...prev,
      google: { ...prev.google, loading: true },
    }));

    try {
      const response = await fetch("/api/auth/google/calendar", {
        credentials: "include",
      });

      if (response.ok) {
        const data = await response.json();
        // Abrir URL de autorização em nova janela
        window.open(data.authUrl, "google-auth", "width=500,height=600");

        toast({
          title: "Redirecionamento",
          description: "Complete a autorização no Google Calendar",
        });

        // Monitorar se a janela foi fechada para verificar status
        const checkAuthStatus = setInterval(async () => {
          try {
            const statusResponse = await fetch("/api/calendar/status", {
              credentials: "include",
            });
            if (statusResponse.ok) {
              const statusData = await statusResponse.json();
              if (statusData.connections.google.connected) {
                setCalendarConnections((prev) => ({
                  ...prev,
                  google: { connected: true, loading: false },
                }));
                clearInterval(checkAuthStatus);
                toast({
                  title: "Sucesso",
                  description: "Google Calendar conectado com sucesso",
                });
              }
            }
          } catch (error) {
            console.log("Aguardando autorização...");
          }
        }, 2000);

        // Limpar intervalo após 2 minutos
        setTimeout(() => {
          clearInterval(checkAuthStatus);
          setCalendarConnections((prev) => ({
            ...prev,
            google: { ...prev.google, loading: false },
          }));
        }, 120000);
      } else {
        throw new Error("Falha ao iniciar autenticação");
      }
    } catch (error) {
      console.error("Erro ao conectar Google Calendar:", error);
      setCalendarConnections((prev) => ({
        ...prev,
        google: { ...prev.google, loading: false },
      }));
      toast({
        title: "Erro",
        description: "Falha ao conectar com Google Calendar",
        variant: "destructive",
      });
    }
  };

  // Conectar com Outlook Calendar
  const handleConnectOutlook = async () => {
    setCalendarConnections((prev) => ({
      ...prev,
      outlook: { ...prev.outlook, loading: true },
    }));

    try {
      const response = await fetch("/api/auth/outlook/calendar", {
        credentials: "include",
      });

      if (response.ok) {
        const data = await response.json();
        // Abrir URL de autorização em nova janela
        window.open(data.authUrl, "outlook-auth", "width=500,height=600");

        toast({
          title: "Redirecionamento",
          description: "Complete a autorização no Outlook Calendar",
        });

        // Monitorar se a janela foi fechada para verificar status
        const checkAuthStatus = setInterval(async () => {
          try {
            const statusResponse = await fetch("/api/calendar/status", {
              credentials: "include",
            });
            if (statusResponse.ok) {
              const statusData = await statusResponse.json();
              if (statusData.connections.outlook.connected) {
                setCalendarConnections((prev) => ({
                  ...prev,
                  outlook: { connected: true, loading: false },
                }));
                clearInterval(checkAuthStatus);
                toast({
                  title: "Sucesso",
                  description: "Outlook Calendar conectado com sucesso",
                });
              }
            }
          } catch (error) {
            console.log("Aguardando autorização...");
          }
        }, 2000);

        // Limpar intervalo após 2 minutos
        setTimeout(() => {
          clearInterval(checkAuthStatus);
          setCalendarConnections((prev) => ({
            ...prev,
            outlook: { ...prev.outlook, loading: false },
          }));
        }, 120000);
      } else {
        throw new Error("Falha ao iniciar autenticação");
      }
    } catch (error) {
      console.error("Erro ao conectar Outlook Calendar:", error);
      setCalendarConnections((prev) => ({
        ...prev,
        outlook: { ...prev.outlook, loading: false },
      }));
      toast({
        title: "Erro",
        description: "Falha ao conectar com Outlook Calendar",
        variant: "destructive",
      });
    }
  };

  // Sincronizar calendários externos
  const handleSyncCalendars = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/calendar/sync", {
        method: "POST",
        credentials: "include",
      });

      if (response.ok) {
        const data = await response.json();

        // Adicionar eventos sincronizados aos eventos locais
        const syncedEvents: CalendarEvent[] = [];

        if (data.results.google?.events) {
          const googleEvents = data.results.google.events.map((event: any) => ({
            id: `google_${event.id}`,
            title: event.summary || "Evento Google",
            start: new Date(event.start.dateTime || event.start.date),
            end: new Date(event.end.dateTime || event.end.date),
            description: event.description,
            type: "synced" as const,
            source: "google" as const,
          }));
          syncedEvents.push(...googleEvents);
        }

        if (data.results.outlook?.events) {
          const outlookEvents = data.results.outlook.events.map(
            (event: any) => ({
              id: `outlook_${event.id}`,
              title: event.subject || "Evento Outlook",
              start: new Date(event.start.dateTime),
              end: new Date(event.end.dateTime),
              description: event.body?.content,
              type: "synced" as const,
              source: "outlook" as const,
            })
          );
          syncedEvents.push(...outlookEvents);
        }

        // Mesclar eventos externos com eventos locais
        const localEvents = events.filter((e) => e.source === "manual");
        setEvents([...localEvents, ...syncedEvents]);

        let message = "Calendários sincronizados com sucesso!";
        if (data.results.google) {
          message += ` Google: ${data.results.google.count} eventos.`;
        }
        if (data.results.outlook) {
          message += ` Outlook: ${data.results.outlook.count} eventos.`;
        }

        toast({
          title: "Sucesso",
          description: message,
        });
      } else {
        throw new Error("Falha na sincronização");
      }
    } catch (error) {
      console.error("Erro ao sincronizar calendários:", error);
      toast({
        title: "Erro",
        description: "Falha ao sincronizar calendários externos",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const eventTypes = [
    { value: "training", label: "Treino", color: "bg-green-500" },
    { value: "consultation", label: "Consulta", color: "bg-amber-500" },
    { value: "personal", label: "Pessoal", color: "bg-indigo-500" },
  ];

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <CalendarIcon className="h-5 w-5" />
            Agenda
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleSyncCalendars}
              disabled={isLoading}
            >
              <RefreshCw
                className={`h-4 w-4 mr-2 ${isLoading ? "animate-spin" : ""}`}
              />
              {isLoading ? "Sincronizando..." : "Sincronizar"}
            </Button>
            <Dialog
              open={showSettingsModal}
              onOpenChange={setShowSettingsModal}
            >
              <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                  <Settings className="h-4 w-4" />
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Configurações de Calendário</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium mb-2">
                      Conectar Calendários Externos
                    </h4>
                    <div className="space-y-2">
                      <Button
                        variant="outline"
                        className="w-full justify-start"
                        onClick={handleConnectGoogle}
                        disabled={calendarConnections.google.loading}
                      >
                        {calendarConnections.google.loading ? (
                          <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                        ) : calendarConnections.google.connected ? (
                          "✅"
                        ) : (
                          "📅"
                        )}{" "}
                        {calendarConnections.google.connected
                          ? "Google Calendar Conectado"
                          : calendarConnections.google.loading
                          ? "Conectando..."
                          : "Conectar Google Calendar"}
                      </Button>
                      <Button
                        variant="outline"
                        className="w-full justify-start"
                        onClick={handleConnectOutlook}
                        disabled={calendarConnections.outlook.loading}
                      >
                        {calendarConnections.outlook.loading ? (
                          <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                        ) : calendarConnections.outlook.connected ? (
                          "✅"
                        ) : (
                          "📅"
                        )}{" "}
                        {calendarConnections.outlook.connected
                          ? "Outlook Calendar Conectado"
                          : calendarConnections.outlook.loading
                          ? "Conectando..."
                          : "Conectar Outlook Calendar"}
                      </Button>
                    </div>
                  </div>
                  <div>
                    <h4 className="font-medium mb-2">Tipos de Evento</h4>
                    <div className="space-y-2">
                      {eventTypes.map((type) => (
                        <div
                          key={type.value}
                          className="flex items-center gap-2"
                        >
                          <div
                            className={`w-3 h-3 rounded-full ${type.color}`}
                          />
                          <span className="text-sm">{type.label}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Legend */}
          <div className="flex flex-wrap gap-2">
            {eventTypes.map((type) => (
              <Badge key={type.value} variant="secondary" className="text-xs">
                <div className={`w-2 h-2 rounded-full ${type.color} mr-1`} />
                {type.label}
              </Badge>
            ))}
          </div>

          {/* Calendar */}
          <div className="h-[600px]">
            <Calendar
              localizer={localizer}
              events={events}
              startAccessor="start"
              endAccessor="end"
              style={{ height: "100%" }}
              onSelectEvent={handleSelectEvent}
              onSelectSlot={handleSelectSlot}
              selectable
              eventPropGetter={eventStyleGetter}
              view={view}
              onView={setView}
              date={date}
              onNavigate={setDate}
              views={views}
              defaultDate={defaultDate}
              messages={{
                next: "Próximo",
                previous: "Anterior",
                today: "Hoje",
                month: "Mês",
                week: "Semana",
                day: "Dia",
                agenda: "Agenda",
                noEventsInRange: "Nenhum evento neste período",
                showMore: (total: any) => `+ Ver mais (${total})`,
              }}
            />
          </div>
        </div>

        {/* Event Modal */}
        <Dialog open={showEventModal} onOpenChange={setShowEventModal}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>
                {selectedEvent ? "Detalhes do Evento" : "Novo Evento"}
              </DialogTitle>
            </DialogHeader>

            {selectedEvent ? (
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium">{selectedEvent.title}</h4>
                  <p className="text-sm text-gray-600">
                    {moment(selectedEvent.start).format("DD/MM/YYYY HH:mm")} -
                    {moment(selectedEvent.end).format("HH:mm")}
                  </p>
                </div>
                {selectedEvent.description && (
                  <div>
                    <Label>Descrição</Label>
                    <p className="text-sm">{selectedEvent.description}</p>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <Badge variant="secondary">
                    {
                      eventTypes.find((t) => t.value === selectedEvent.type)
                        ?.label
                    }
                  </Badge>
                  {selectedEvent.source &&
                    selectedEvent.source !== "manual" && (
                      <Badge variant="outline">
                        {selectedEvent.source === "google"
                          ? "Google"
                          : "Outlook"}
                      </Badge>
                    )}
                </div>
                {selectedEvent.studentName && (
                  <div>
                    <Label>Aluno</Label>
                    <p className="text-sm">{selectedEvent.studentName}</p>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <Label htmlFor="title">Título *</Label>
                  <Input
                    id="title"
                    value={newEvent.title}
                    onChange={(e) =>
                      setNewEvent((prev) => ({
                        ...prev,
                        title: e.target.value,
                      }))
                    }
                    placeholder="Título do evento"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="start">Início *</Label>
                    <Input
                      id="start"
                      type="datetime-local"
                      value={newEvent.start}
                      onChange={(e) =>
                        setNewEvent((prev) => ({
                          ...prev,
                          start: e.target.value,
                        }))
                      }
                    />
                  </div>
                  <div>
                    <Label htmlFor="end">Fim *</Label>
                    <Input
                      id="end"
                      type="datetime-local"
                      value={newEvent.end}
                      onChange={(e) =>
                        setNewEvent((prev) => ({
                          ...prev,
                          end: e.target.value,
                        }))
                      }
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="type">Tipo</Label>
                  <Select
                    value={newEvent.type}
                    onValueChange={(value: CalendarEvent["type"]) =>
                      setNewEvent((prev) => ({ ...prev, type: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {eventTypes.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="description">Descrição</Label>
                  <Textarea
                    id="description"
                    value={newEvent.description}
                    onChange={(e) =>
                      setNewEvent((prev) => ({
                        ...prev,
                        description: e.target.value,
                      }))
                    }
                    placeholder="Descrição opcional"
                    rows={3}
                  />
                </div>

                <div className="flex justify-end gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setShowEventModal(false)}
                  >
                    Cancelar
                  </Button>
                  <Button onClick={handleCreateEvent}>Criar Evento</Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}
