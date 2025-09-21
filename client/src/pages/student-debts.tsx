import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import {
  CreditCard,
  Calendar,
  DollarSign,
  AlertTriangle,
  CheckCircle,
  QrCode,
  Copy,
  Clock,
  Smartphone,
} from "lucide-react";
import type { Student } from "@shared/schema";

interface StudentCharge {
  id: string;
  title: string;
  description?: string;
  amount: number;
  dueDate: string;
  status: "pending" | "partial" | "paid" | "overdue" | "cancelled";
  paidAmount: number;
  category: string;
  isRecurring: boolean;
}

interface PaymentResponse {
  id: string;
  transactionId: string;
  amount: number;
  pixQrCode?: string;
  pixCopyPaste?: string;
  expiresAt?: string;
  status: string;
  cardBrand?: string;
  cardLastFour?: string;
}

interface StudentDebtsProps {
  student: Student;
}

const STATUS_COLORS = {
  pending: "bg-yellow-100 text-yellow-800",
  partial: "bg-blue-100 text-blue-800",
  paid: "bg-green-100 text-green-800",
  overdue: "bg-red-100 text-red-800",
  cancelled: "bg-gray-100 text-gray-800",
};

const STATUS_LABELS = {
  pending: "Pendente",
  partial: "Parcial",
  paid: "Pago",
  overdue: "Vencido",
  cancelled: "Cancelado",
};

const CATEGORY_LABELS = {
  student_monthly: "Mensalidade",
  student_assessment: "Avaliação Física",
  student_personal_training: "Personal Training",
  other: "Outros",
};

export function StudentDebts({ student }: StudentDebtsProps) {
  const [selectedCharge, setSelectedCharge] = useState<StudentCharge | null>(
    null
  );
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [paymentResult, setPaymentResult] = useState<PaymentResponse | null>(
    null
  );
  const [showPixQr, setShowPixQr] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<"pix" | "card">("pix");
  const [cardData, setCardData] = useState({
    number: "",
    name: "",
    expiry: "",
    cvv: "",
  });
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState("");
  const [pixPollingActive, setPixPollingActive] = useState(false);
  const [pixTimeRemaining, setPixTimeRemaining] = useState(0);

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Buscar cobranças do aluno
  const { data: charges, isLoading } = useQuery({
    queryKey: ["/api/student/charges"],
    queryFn: async () => {
      const response = await fetch("/api/student/charges", {
        credentials: "include",
      });
      if (!response.ok) {
        throw new Error(`Failed to fetch charges: ${response.status}`);
      }
      const data = await response.json();
      return data.charges as StudentCharge[];
    },
  });

  // Polling PIX status
  const { data: pixStatus } = useQuery({
    queryKey: ["/api/student/payments/status", paymentResult?.id],
    queryFn: async () => {
      if (!paymentResult?.id) return null;
      const response = await fetch(
        `/api/student/payments/status/${paymentResult.id}`,
        {
          credentials: "include",
        }
      );
      if (!response.ok) return null;
      const data = await response.json();
      return data.payment;
    },
    enabled: pixPollingActive && !!paymentResult?.id,
    refetchInterval: 5000, // Poll every 5 seconds
  });

  // Timer para PIX expiration
  useEffect(() => {
    if (paymentResult?.expiresAt) {
      const expiresAt = new Date(paymentResult.expiresAt);
      const updateTimer = () => {
        const now = new Date();
        const timeLeft = Math.max(
          0,
          Math.floor((expiresAt.getTime() - now.getTime()) / 1000)
        );
        setPixTimeRemaining(timeLeft);

        if (timeLeft === 0) {
          setPixPollingActive(false);
          setShowPixQr(false);
          setError("PIX expirado. Gere um novo PIX para pagar.");
        }
      };

      updateTimer();
      const interval = setInterval(updateTimer, 1000);
      return () => clearInterval(interval);
    }
  }, [paymentResult?.expiresAt]);

  // Check PIX payment status
  useEffect(() => {
    if (pixStatus?.status === "completed") {
      setPixPollingActive(false);
      setShowPixQr(false);
      setShowPaymentDialog(false);
      queryClient.invalidateQueries({ queryKey: ["/api/student/charges"] });
      toast({
        title: "Pagamento Confirmado!",
        description: "Seu PIX foi processado com sucesso.",
      });
    }
  }, [pixStatus, queryClient, toast]);

  // Mutação para criar pagamento PIX
  const createPixPayment = useMutation({
    mutationFn: async ({
      accountId,
      amount,
    }: {
      accountId: string;
      amount: number;
    }) => {
      const response = await fetch("/api/student/payments/pix", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ accountId, amount }),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Erro ao criar pagamento PIX");
      }
      const data = await response.json();
      return data.payment as PaymentResponse;
    },
    onSuccess: (data) => {
      setPaymentResult(data);
      setShowPixQr(true);
      setPixPollingActive(true);
      setError("");
      toast({
        title: "PIX Gerado!",
        description: "QR Code criado. Você tem 30 minutos para pagar.",
      });
    },
    onError: (error: any) => {
      setError(error.message);
    },
  });

  // Mutação para criar pagamento com cartão
  const createCardPayment = useMutation({
    mutationFn: async ({
      accountId,
      amount,
      cardToken,
    }: {
      accountId: string;
      amount: number;
      cardToken: string;
    }) => {
      const response = await fetch("/api/student/payments/card", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ accountId, amount, cardToken }),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Erro ao processar pagamento");
      }
      const data = await response.json();
      return data.payment as PaymentResponse;
    },
    onSuccess: (data) => {
      setPaymentResult(data);
      queryClient.invalidateQueries({ queryKey: ["/api/student/charges"] });
      toast({
        title: "Pagamento Aprovado!",
        description: "Seu pagamento foi processado com sucesso.",
      });
    },
    onError: (error: any) => {
      setError(error.message);
    },
  });

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("pt-BR");
  };

  const getRemainingAmount = (charge: StudentCharge) => {
    return charge.amount - charge.paidAmount;
  };

  const isOverdue = (charge: StudentCharge) => {
    return charge.status === "overdue" || new Date(charge.dueDate) < new Date();
  };

  const handlePayClick = (charge: StudentCharge) => {
    setSelectedCharge(charge);
    setShowPaymentDialog(true);
    setPaymentResult(null);
    setShowPixQr(false);
    setPixPollingActive(false);
    setPixTimeRemaining(0);
    setError("");
  };

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes.toString().padStart(2, "0")}:${secs
      .toString()
      .padStart(2, "0")}`;
  };

  const handlePixPayment = async () => {
    if (!selectedCharge) return;

    setIsProcessing(true);
    setError("");

    try {
      await createPixPayment.mutateAsync({
        accountId: selectedCharge.id,
        amount: getRemainingAmount(selectedCharge),
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCardPayment = async () => {
    if (!selectedCharge) return;

    setIsProcessing(true);
    setError("");

    try {
      // Em uma implementação real, você integraria com um tokenizador de cartão seguro
      // Por agora, vamos simular um token
      const cardToken = `card_token_${Date.now()}`;

      await createCardPayment.mutateAsync({
        accountId: selectedCharge.id,
        amount: getRemainingAmount(selectedCharge),
        cardToken,
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copiado!",
      description: "Código PIX copiado para a área de transferência.",
    });
  };

  const pendingCharges =
    charges?.filter(
      (charge) =>
        charge.status === "pending" ||
        charge.status === "partial" ||
        charge.status === "overdue"
    ) || [];

  const totalDebt = pendingCharges.reduce(
    (sum, charge) => sum + getRemainingAmount(charge),
    0
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Minhas Cobranças</h1>
        <p className="text-gray-600">
          Visualize e pague suas mensalidades e taxas
        </p>
      </div>

      {/* Summary Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Resumo Financeiro
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-red-50 rounded-lg">
              <div className="text-2xl font-bold text-red-600">
                {formatCurrency(totalDebt)}
              </div>
              <p className="text-sm text-red-700">Total em Aberto</p>
            </div>
            <div className="text-center p-4 bg-yellow-50 rounded-lg">
              <div className="text-2xl font-bold text-yellow-600">
                {pendingCharges.filter((c) => isOverdue(c)).length}
              </div>
              <p className="text-sm text-yellow-700">Cobranças Vencidas</p>
            </div>
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">
                {pendingCharges.length}
              </div>
              <p className="text-sm text-blue-700">Cobranças Pendentes</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Charges Table */}
      <Card>
        <CardHeader>
          <CardTitle>Cobranças Pendentes</CardTitle>
          <CardDescription>
            Lista de mensalidades e taxas em aberto
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <div
                  key={i}
                  className="h-12 bg-gray-200 rounded animate-pulse"
                ></div>
              ))}
            </div>
          ) : pendingCharges.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Descrição</TableHead>
                  <TableHead>Categoria</TableHead>
                  <TableHead>Valor</TableHead>
                  <TableHead>Vencimento</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pendingCharges.map((charge) => (
                  <TableRow key={charge.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{charge.title}</div>
                        {charge.description && (
                          <div className="text-sm text-muted-foreground">
                            {charge.description}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {CATEGORY_LABELS[
                        charge.category as keyof typeof CATEGORY_LABELS
                      ] || charge.category}
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">
                          {formatCurrency(charge.amount)}
                        </div>
                        {charge.paidAmount > 0 && (
                          <div className="text-sm text-muted-foreground">
                            Pago: {formatCurrency(charge.paidAmount)}
                          </div>
                        )}
                        {getRemainingAmount(charge) !== charge.amount && (
                          <div className="text-sm font-medium text-red-600">
                            Restante:{" "}
                            {formatCurrency(getRemainingAmount(charge))}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div
                        className={`flex items-center gap-1 ${
                          isOverdue(charge) ? "text-red-600" : ""
                        }`}
                      >
                        <Calendar className="h-4 w-4" />
                        {formatDate(charge.dueDate)}
                        {isOverdue(charge) && (
                          <AlertTriangle className="h-4 w-4 ml-1" />
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={STATUS_COLORS[charge.status]}>
                        {STATUS_LABELS[charge.status]}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Button
                        size="sm"
                        onClick={() => handlePayClick(charge)}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        <CreditCard className="h-4 w-4 mr-1" />
                        Pagar
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-8">
              <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Tudo em dia!
              </h3>
              <p className="text-gray-600">
                Você não possui cobranças pendentes no momento.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Payment Dialog */}
      <Dialog open={showPaymentDialog} onOpenChange={setShowPaymentDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Pagar Cobrança</DialogTitle>
          </DialogHeader>

          {selectedCharge && (
            <div className="space-y-4">
              {/* Charge Info */}
              <div className="p-4 bg-gray-50 rounded-lg">
                <h3 className="font-medium">{selectedCharge.title}</h3>
                <p className="text-2xl font-bold text-green-600">
                  {formatCurrency(getRemainingAmount(selectedCharge))}
                </p>
                <p className="text-sm text-gray-600">
                  Vencimento: {formatDate(selectedCharge.dueDate)}
                </p>
              </div>

              {error && (
                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {/* Payment Success */}
              {paymentResult && paymentResult.status === "completed" && (
                <Alert>
                  <CheckCircle className="h-4 w-4" />
                  <AlertDescription>
                    Pagamento aprovado! Cartão **** {paymentResult.cardLastFour}
                  </AlertDescription>
                </Alert>
              )}

              {/* PIX QR Code */}
              {showPixQr && paymentResult && (
                <div className="space-y-4">
                  <div className="text-center">
                    {paymentResult.pixQrCode ? (
                      <img
                        src={paymentResult.pixQrCode}
                        alt="QR Code PIX"
                        className="h-48 w-48 mx-auto border p-4 rounded-lg bg-white"
                      />
                    ) : (
                      <QrCode className="h-48 w-48 mx-auto border p-4 rounded-lg text-gray-400" />
                    )}
                    <p className="text-sm text-gray-600 mt-2">
                      Escaneie o QR Code ou copie o código PIX
                    </p>
                    {pixTimeRemaining > 0 && (
                      <p className="text-sm font-medium text-orange-600 mt-1">
                        Expira em: {formatTime(pixTimeRemaining)}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label>Código PIX (Copia e Cola)</Label>
                    <div className="flex gap-2">
                      <Input
                        value={paymentResult.pixCopyPaste || ""}
                        readOnly
                        className="font-mono text-xs"
                      />
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() =>
                          copyToClipboard(paymentResult.pixCopyPaste || "")
                        }
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  <Alert>
                    <Clock className="h-4 w-4" />
                    <AlertDescription>
                      {pixPollingActive
                        ? "Aguardando confirmação do pagamento..."
                        : "Este PIX expira em 30 minutos. O pagamento será confirmado automaticamente."}
                    </AlertDescription>
                  </Alert>

                  {pixPollingActive && (
                    <div className="flex items-center justify-center space-x-2 text-sm text-blue-600">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                      <span>Verificando pagamento...</span>
                    </div>
                  )}
                </div>
              )}

              {/* Payment Methods */}
              {!showPixQr && !paymentResult && (
                <Tabs
                  value={paymentMethod}
                  onValueChange={(value) =>
                    setPaymentMethod(value as "pix" | "card")
                  }
                >
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="pix">PIX</TabsTrigger>
                    <TabsTrigger value="card">Cartão</TabsTrigger>
                  </TabsList>

                  <TabsContent value="pix" className="space-y-4">
                    <div className="text-center py-4">
                      <Smartphone className="h-12 w-12 text-blue-500 mx-auto mb-2" />
                      <h3 className="font-medium">Pagamento via PIX</h3>
                      <p className="text-sm text-gray-600">
                        Pagamento instantâneo e seguro
                      </p>
                    </div>
                    <Button
                      onClick={handlePixPayment}
                      disabled={isProcessing}
                      className="w-full"
                    >
                      {isProcessing ? "Gerando PIX..." : "Gerar PIX"}
                    </Button>
                  </TabsContent>

                  <TabsContent value="card" className="space-y-4">
                    <div className="space-y-4">
                      <div>
                        <Label>Número do Cartão</Label>
                        <Input
                          placeholder="1234 5678 9012 3456"
                          value={cardData.number}
                          onChange={(e) =>
                            setCardData({ ...cardData, number: e.target.value })
                          }
                        />
                      </div>
                      <div>
                        <Label>Nome no Cartão</Label>
                        <Input
                          placeholder="JOÃO SILVA"
                          value={cardData.name}
                          onChange={(e) =>
                            setCardData({ ...cardData, name: e.target.value })
                          }
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label>Validade</Label>
                          <Input
                            placeholder="MM/AA"
                            value={cardData.expiry}
                            onChange={(e) =>
                              setCardData({
                                ...cardData,
                                expiry: e.target.value,
                              })
                            }
                          />
                        </div>
                        <div>
                          <Label>CVV</Label>
                          <Input
                            placeholder="123"
                            value={cardData.cvv}
                            onChange={(e) =>
                              setCardData({ ...cardData, cvv: e.target.value })
                            }
                          />
                        </div>
                      </div>
                    </div>
                    <Button
                      onClick={handleCardPayment}
                      disabled={
                        isProcessing || !cardData.number || !cardData.name
                      }
                      className="w-full"
                    >
                      {isProcessing ? "Processando..." : "Pagar com Cartão"}
                    </Button>
                  </TabsContent>
                </Tabs>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
