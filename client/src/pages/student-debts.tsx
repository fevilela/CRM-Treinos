import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import {
  CreditCard,
  DollarSign,
  Calendar,
  AlertTriangle,
  CheckCircle,
  Clock,
  TrendingDown,
  Receipt,
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface DebtSummary {
  totalDebt: number;
  overdueAmount: number;
  accountsCount: number;
  lastPaymentDate?: Date;
}

interface FinancialAccount {
  id: string;
  title: string;
  description?: string;
  amount: number;
  dueDate: Date;
  status: "pending" | "partial" | "paid" | "overdue" | "cancelled";
  category: string;
  paidAmount?: number;
  createdAt: Date;
}

interface StudentDebtsData {
  success: boolean;
  summary: DebtSummary;
  accounts: FinancialAccount[];
}

interface StudentDebtsProps {
  student: {
    id: string;
    name: string;
    email: string;
  };
}

export function StudentDebts({ student }: StudentDebtsProps) {
  const [selectedAccount, setSelectedAccount] =
    useState<FinancialAccount | null>(null);

  const {
    data: debtsData,
    isLoading,
    error,
    refetch,
  } = useQuery<StudentDebtsData>({
    queryKey: ["student-debts"],
    queryFn: async () => {
      const response = await fetch("/api/finances/my-debts", {
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error("Erro ao carregar dívidas");
      }

      return response.json();
    },
  });

  const handlePayment = (account: FinancialAccount) => {
    setSelectedAccount(account);
    // TODO: Implementar modal de pagamento com Stripe
    console.log("Iniciando pagamento para:", account);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(amount);
  };

  const formatDate = (date: Date | string) => {
    return format(new Date(date), "dd 'de' MMMM 'de' yyyy", { locale: ptBR });
  };

  const getStatusBadge = (status: string) => {
    const badges = {
      pending: { text: "Pendente", variant: "secondary" as const },
      partial: { text: "Parcial", variant: "outline" as const },
      overdue: { text: "Vencida", variant: "destructive" as const },
      paid: { text: "Paga", variant: "default" as const },
    };

    const badge = badges[status as keyof typeof badges] || badges.pending;
    return <Badge variant={badge.variant}>{badge.text}</Badge>;
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "paid":
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case "overdue":
        return <AlertTriangle className="w-5 h-5 text-red-600" />;
      case "partial":
        return <Clock className="w-5 h-5 text-orange-600" />;
      default:
        return <Receipt className="w-5 h-5 text-blue-600" />;
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Minhas Contas
          </h1>
        </div>
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Carregando suas contas...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Minhas Contas
          </h1>
        </div>
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Erro ao carregar suas contas. Tente novamente.
            <Button
              variant="outline"
              size="sm"
              onClick={() => refetch()}
              className="ml-2"
            >
              Tentar novamente
            </Button>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const { summary, accounts } = debtsData || { summary: null, accounts: [] };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Minhas Contas
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Visualize e quite suas pendências financeiras
        </p>
      </div>

      {/* Summary Cards */}
      {summary && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total em Aberto
              </CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                {formatCurrency(summary.totalDebt)}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Contas Vencidas
              </CardTitle>
              <AlertTriangle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                {formatCurrency(summary.overdueAmount)}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total de Contas
              </CardTitle>
              <Receipt className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{summary.accountsCount}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Último Pagamento
              </CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-sm">
                {summary.lastPaymentDate
                  ? formatDate(summary.lastPaymentDate)
                  : "Nenhum pagamento"}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Accounts List */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold">Contas Pendentes</h2>

        {accounts.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <CheckCircle className="w-12 h-12 text-green-600 mb-4" />
              <h3 className="text-lg font-semibold mb-2">Parabéns!</h3>
              <p className="text-muted-foreground text-center">
                Você não possui contas pendentes no momento.
              </p>
            </CardContent>
          </Card>
        ) : (
          accounts.map((account) => {
            const remainingAmount = account.amount - (account.paidAmount || 0);
            const isOverdue =
              new Date(account.dueDate) < new Date() &&
              account.status !== "paid";

            return (
              <Card
                key={account.id}
                className={isOverdue ? "border-red-200 bg-red-50/50" : ""}
              >
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-3">
                      {getStatusIcon(account.status)}
                      <div>
                        <CardTitle className="text-lg">
                          {account.title}
                        </CardTitle>
                        {account.description && (
                          <CardDescription className="mt-1">
                            {account.description}
                          </CardDescription>
                        )}
                      </div>
                    </div>
                    {getStatusBadge(account.status)}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-muted-foreground">
                          Valor Total
                        </p>
                        <p className="text-lg font-semibold">
                          {formatCurrency(account.amount)}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">
                          Valor Pendente
                        </p>
                        <p className="text-lg font-semibold text-red-600">
                          {formatCurrency(remainingAmount)}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">
                          Vencimento
                        </p>
                        <p
                          className={`text-sm ${
                            isOverdue ? "text-red-600 font-semibold" : ""
                          }`}
                        >
                          {formatDate(account.dueDate)}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">
                          Criada em
                        </p>
                        <p className="text-sm">
                          {formatDate(account.createdAt)}
                        </p>
                      </div>
                    </div>

                    {account.paidAmount && account.paidAmount > 0 && (
                      <div className="bg-green-50 p-3 rounded-md">
                        <p className="text-sm text-green-700">
                          Já pago: {formatCurrency(account.paidAmount)}
                        </p>
                      </div>
                    )}

                    <Separator />

                    <div className="flex justify-between items-center">
                      <div className="text-sm text-muted-foreground">
                        Categoria: {account.category}
                      </div>
                      <Button
                        onClick={() => handlePayment(account)}
                        disabled={account.status === "paid"}
                        className="flex items-center space-x-2"
                      >
                        <CreditCard className="w-4 h-4" />
                        <span>Pagar {formatCurrency(remainingAmount)}</span>
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>

      {/* Payment Modal - TODO: Implementar com Stripe */}
      {selectedAccount && (
        <Alert>
          <CreditCard className="h-4 w-4" />
          <AlertDescription>
            Sistema de pagamento em desenvolvimento. Pagamento selecionado:{" "}
            {selectedAccount.title}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSelectedAccount(null)}
              className="ml-2"
            >
              Fechar
            </Button>
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}
