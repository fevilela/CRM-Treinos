import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Plus,
  CreditCard,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Calendar,
  DollarSign,
  Users,
  FileDown,
} from "lucide-react";

// Types
interface FinancialAccount {
  id: string;
  personalTrainerId: string;
  studentId?: string;
  studentName?: string;
  type: "receivable" | "payable";
  category: string;
  title: string;
  description?: string;
  amount: number;
  dueDate: string;
  status: "pending" | "partial" | "paid" | "overdue" | "cancelled";
  paidAmount: number;
  paidAt?: string;
  installments?: number;
  currentInstallment?: number;
  isRecurring: boolean;
  recurringInterval?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

interface Payment {
  id: string;
  accountId: string;
  amount: number;
  paymentDate: string;
  paymentMethod: string;
  description?: string;
  createdAt: string;
}

interface DashboardSummary {
  totalReceivable: number;
  totalPayable: number;
  totalOverdue: number;
  monthlyIncome: number;
  monthlyExpenses: number;
  netIncome: number;
  pendingPayments: number;
}

const CATEGORY_OPTIONS = [
  { value: "student_monthly", label: "Mensalidade de Aluno" },
  { value: "student_assessment", label: "Avaliação Física" },
  { value: "student_personal_training", label: "Personal Training" },
  { value: "rent", label: "Aluguel" },
  { value: "equipment", label: "Equipamentos" },
  { value: "marketing", label: "Marketing" },
  { value: "utilities", label: "Contas de Consumo" },
  { value: "insurance", label: "Seguros" },
  { value: "other", label: "Outros" },
];

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

function Finances() {
  const [filterType, setFilterType] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [filterPeriod, setFilterPeriod] = useState<string>("all");
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [selectedAccount, setSelectedAccount] =
    useState<FinancialAccount | null>(null);
  const [isDownloadingPDF, setIsDownloadingPDF] = useState(false);

  // Fetch dashboard summary
  const { data: dashboardData, isLoading: isDashboardLoading } = useQuery({
    queryKey: ["/api/finances/dashboard"],
    queryFn: async () => {
      const response = await fetch("/api/finances/dashboard", {
        credentials: "include",
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      return data.summary as DashboardSummary;
    },
  });

  // Build query params for filters
  const buildQueryParams = () => {
    const params = new URLSearchParams();
    if (filterType !== "all") params.append("type", filterType);
    if (filterStatus !== "all") params.append("status", filterStatus);
    if (filterCategory !== "all") params.append("category", filterCategory);
    if (filterPeriod !== "all") params.append("period", filterPeriod);
    return params.toString();
  };

  // Fetch financial accounts
  const {
    data: accounts,
    isLoading: isAccountsLoading,
    refetch: refetchAccounts,
  } = useQuery({
    queryKey: [
      "/api/finances/accounts",
      filterType,
      filterStatus,
      filterCategory,
      filterPeriod,
    ],
    queryFn: async () => {
      const queryParams = buildQueryParams();
      const url = `/api/finances/accounts${
        queryParams ? `?${queryParams}` : ""
      }`;
      const response = await fetch(url, {
        credentials: "include",
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      return data.accounts as FinancialAccount[];
    },
  });

  // Fetch students for dropdown
  const { data: students } = useQuery({
    queryKey: ["/api/students"],
    queryFn: async () => {
      const response = await fetch("/api/students", {
        credentials: "include",
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      return data; // API returns array directly, not { students }
    },
  });

  const formatCurrency = (value: number) => {
    // Handle NaN, null, undefined, or invalid numbers
    const numericValue = isNaN(value) || value == null ? 0 : value;
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(numericValue);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("pt-BR");
  };

  const getStatusColor = (status: string) => {
    return (
      STATUS_COLORS[status as keyof typeof STATUS_COLORS] ||
      "bg-gray-100 text-gray-800"
    );
  };

  const getStatusLabel = (status: string) => {
    return STATUS_LABELS[status as keyof typeof STATUS_LABELS] || status;
  };

  const getCategoryLabel = (category: string) => {
    const option = CATEGORY_OPTIONS.find((opt) => opt.value === category);
    return option?.label || category;
  };

  // Handle PDF download
  const handleDownloadPDF = async () => {
    setIsDownloadingPDF(true);
    try {
      const params = new URLSearchParams();
      if (filterType !== "all") params.append("accountType", filterType);
      if (filterStatus !== "all") params.append("status", filterStatus);
      if (filterCategory !== "all") params.append("category", filterCategory);

      // Add date filters based on period selection
      const now = new Date();
      if (filterPeriod === "week") {
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        params.append("startDate", weekAgo.toISOString().split("T")[0]);
        params.append("endDate", now.toISOString().split("T")[0]);
      } else if (filterPeriod === "month") {
        const monthAgo = new Date(
          now.getFullYear(),
          now.getMonth() - 1,
          now.getDate()
        );
        params.append("startDate", monthAgo.toISOString().split("T")[0]);
        params.append("endDate", now.toISOString().split("T")[0]);
      } else if (filterPeriod === "semester") {
        const semesterAgo = new Date(
          now.getFullYear(),
          now.getMonth() - 6,
          now.getDate()
        );
        params.append("startDate", semesterAgo.toISOString().split("T")[0]);
        params.append("endDate", now.toISOString().split("T")[0]);
      } else if (filterPeriod === "year") {
        const yearAgo = new Date(
          now.getFullYear() - 1,
          now.getMonth(),
          now.getDate()
        );
        params.append("startDate", yearAgo.toISOString().split("T")[0]);
        params.append("endDate", now.toISOString().split("T")[0]);
      }

      const url = `/api/financial/report/pdf${
        params.toString() ? `?${params.toString()}` : ""
      }`;

      const response = await fetch(url, {
        credentials: "include",
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("PDF generation failed:", response.status, errorText);
        throw new Error(
          `Falha ao gerar PDF: ${response.status} - ${errorText}`
        );
      }

      // Get filename from response headers or create default
      const contentDisposition = response.headers.get("content-disposition");
      const filename = contentDisposition
        ? contentDisposition.split("filename=")[1].replace(/['"]/g, "")
        : "relatorio_financeiro.pdf";

      // Download the file
      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = downloadUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);
    } catch (error) {
      console.error("Erro ao baixar PDF:", error);
      alert("Erro ao gerar PDF financeiro. Tente novamente.");
    } finally {
      setIsDownloadingPDF(false);
    }
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Gestão Financeira
          </h1>
          <p className="text-muted-foreground">
            Controle suas contas a receber e a pagar
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={handleDownloadPDF}
            disabled={isDownloadingPDF}
            variant="outline"
          >
            <FileDown className="h-4 w-4 mr-2" />
            {isDownloadingPDF ? "Gerando..." : "Baixar PDF"}
          </Button>
          <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Nova Conta
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Criar Nova Conta</DialogTitle>
              </DialogHeader>
              <CreateAccountForm
                students={students}
                onSuccess={() => {
                  setShowCreateDialog(false);
                  refetchAccounts();
                }}
              />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Dashboard Cards */}
      {isDashboardLoading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <div className="h-4 bg-gray-200 rounded w-24 animate-pulse"></div>
                <div className="h-4 w-4 bg-gray-200 rounded animate-pulse"></div>
              </CardHeader>
              <CardContent>
                <div className="h-8 bg-gray-200 rounded w-32 animate-pulse"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : dashboardData ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">A Receber</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {formatCurrency(dashboardData.totalReceivable)}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">A Pagar</CardTitle>
              <TrendingDown className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                {formatCurrency(dashboardData.totalPayable)}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Vencidas</CardTitle>
              <AlertTriangle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">
                {formatCurrency(dashboardData.totalOverdue)}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Resultado Mensal
              </CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div
                className={`text-2xl font-bold ${
                  dashboardData.netIncome >= 0
                    ? "text-green-600"
                    : "text-red-600"
                }`}
              >
                {formatCurrency(dashboardData.netIncome)}
              </div>
              <p className="text-xs text-muted-foreground">
                Receitas: {formatCurrency(dashboardData.monthlyIncome)} |
                Despesas: {formatCurrency(dashboardData.monthlyExpenses)}
              </p>
            </CardContent>
          </Card>
        </div>
      ) : null}

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <Label>Tipo</Label>
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos os tipos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os tipos</SelectItem>
                  <SelectItem value="receivable">A Receber</SelectItem>
                  <SelectItem value="payable">A Pagar</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Status</Label>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos os status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os status</SelectItem>
                  <SelectItem value="pending">Pendente</SelectItem>
                  <SelectItem value="partial">Parcial</SelectItem>
                  <SelectItem value="paid">Pago</SelectItem>
                  <SelectItem value="overdue">Vencido</SelectItem>
                  <SelectItem value="cancelled">Cancelado</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Categoria</Label>
              <Select value={filterCategory} onValueChange={setFilterCategory}>
                <SelectTrigger>
                  <SelectValue placeholder="Todas as categorias" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as categorias</SelectItem>
                  {CATEGORY_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Período</Label>
              <Select value={filterPeriod} onValueChange={setFilterPeriod}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos os períodos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os períodos</SelectItem>
                  <SelectItem value="week">Esta semana</SelectItem>
                  <SelectItem value="month">Este mês</SelectItem>
                  <SelectItem value="semester">Este semestre</SelectItem>
                  <SelectItem value="year">Este ano</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Accounts Table */}
      <Card>
        <CardHeader>
          <CardTitle>Contas Financeiras</CardTitle>
          <CardDescription>
            Gerencie suas contas a receber e a pagar
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isAccountsLoading ? (
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <div
                  key={i}
                  className="h-12 bg-gray-200 rounded animate-pulse"
                ></div>
              ))}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Título</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Categoria</TableHead>
                  <TableHead>Aluno</TableHead>
                  <TableHead>Valor</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Vencimento</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {accounts && accounts.length > 0 ? (
                  accounts.map((account) => (
                    <TableRow key={account.id}>
                      <TableCell className="font-medium">
                        {account.title}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            account.type === "receivable"
                              ? "default"
                              : "secondary"
                          }
                        >
                          {account.type === "receivable"
                            ? "A Receber"
                            : "A Pagar"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {getCategoryLabel(account.category)}
                      </TableCell>
                      <TableCell>{account.studentName || "-"}</TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">
                            {formatCurrency(account.amount)}
                          </div>
                          {account.paidAmount > 0 && (
                            <div className="text-sm text-muted-foreground">
                              Pago: {formatCurrency(account.paidAmount)}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(account.status)}>
                          {getStatusLabel(account.status)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          {formatDate(account.dueDate)}
                        </div>
                      </TableCell>
                      <TableCell>
                        {account.status !== "paid" &&
                          account.status !== "cancelled" && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setSelectedAccount(account);
                                setShowPaymentDialog(true);
                              }}
                            >
                              <CreditCard className="h-4 w-4 mr-1" />
                              Pagar
                            </Button>
                          )}
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8">
                      Nenhuma conta encontrada
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Payment Dialog */}
      {selectedAccount && (
        <Dialog open={showPaymentDialog} onOpenChange={setShowPaymentDialog}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Registrar Pagamento</DialogTitle>
            </DialogHeader>
            <PaymentForm
              account={selectedAccount}
              onSuccess={() => {
                setShowPaymentDialog(false);
                setSelectedAccount(null);
                refetchAccounts();
              }}
            />
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

// Create Account Form Component
function CreateAccountForm({
  students,
  onSuccess,
}: {
  students: any[];
  onSuccess: () => void;
}) {
  const [formData, setFormData] = useState({
    type: "receivable",
    category: "student_monthly",
    title: "",
    description: "",
    amount: "",
    dueDate: "",
    studentId: "none",
    isRecurring: false,
    notes: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError("");

    try {
      const response = await fetch("/api/finances/accounts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          ...formData,
          amount: parseFloat(formData.amount) || 0,
          dueDate: formData.dueDate
            ? new Date(formData.dueDate).toISOString()
            : new Date().toISOString(),
          studentId:
            formData.studentId === "none" ? null : formData.studentId || null,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Erro ao criar conta");
      }

      onSuccess();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="type">Tipo</Label>
          <Select
            value={formData.type}
            onValueChange={(value) => setFormData({ ...formData, type: value })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="receivable">A Receber</SelectItem>
              <SelectItem value="payable">A Pagar</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="category">Categoria</Label>
          <Select
            value={formData.category}
            onValueChange={(value) =>
              setFormData({ ...formData, category: value })
            }
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {CATEGORY_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div>
        <Label htmlFor="title">Título</Label>
        <Input
          id="title"
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          required
        />
      </div>

      <div>
        <Label htmlFor="studentId">Aluno (opcional)</Label>
        <Select
          value={formData.studentId}
          onValueChange={(value) =>
            setFormData({ ...formData, studentId: value })
          }
        >
          <SelectTrigger>
            <SelectValue placeholder="Selecione um aluno" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">Nenhum aluno</SelectItem>
            {students?.map((student) => (
              <SelectItem key={student.id} value={student.id}>
                {student.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="amount">Valor</Label>
          <Input
            id="amount"
            type="number"
            step="0.01"
            value={formData.amount}
            onChange={(e) =>
              setFormData({ ...formData, amount: e.target.value })
            }
            required
          />
        </div>
        <div>
          <Label htmlFor="dueDate">Vencimento</Label>
          <Input
            id="dueDate"
            type="date"
            value={formData.dueDate}
            onChange={(e) =>
              setFormData({ ...formData, dueDate: e.target.value })
            }
            required
          />
        </div>
      </div>

      <div>
        <Label htmlFor="description">Descrição</Label>
        <Input
          id="description"
          value={formData.description}
          onChange={(e) =>
            setFormData({ ...formData, description: e.target.value })
          }
        />
      </div>

      <Button type="submit" disabled={isSubmitting} className="w-full">
        {isSubmitting ? "Criando..." : "Criar Conta"}
      </Button>
    </form>
  );
}

// Payment Form Component
function PaymentForm({
  account,
  onSuccess,
}: {
  account: FinancialAccount;
  onSuccess: () => void;
}) {
  const [formData, setFormData] = useState({
    amount: "",
    paymentMethod: "cash",
    description: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const remainingAmount = account.amount - account.paidAmount;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError("");

    try {
      const response = await fetch(
        `/api/finances/accounts/${account.id}/payments`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify({
            ...formData,
            amount: parseFloat(formData.amount),
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Erro ao registrar pagamento");
      }

      onSuccess();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="bg-gray-50 p-4 rounded-lg">
        <h4 className="font-medium">{account.title}</h4>
        <p className="text-sm text-muted-foreground">
          Valor total:{" "}
          {new Intl.NumberFormat("pt-BR", {
            style: "currency",
            currency: "BRL",
          }).format(account.amount)}
        </p>
        <p className="text-sm text-muted-foreground">
          Já pago:{" "}
          {new Intl.NumberFormat("pt-BR", {
            style: "currency",
            currency: "BRL",
          }).format(account.paidAmount)}
        </p>
        <p className="text-sm font-medium text-red-600">
          Resta:{" "}
          {new Intl.NumberFormat("pt-BR", {
            style: "currency",
            currency: "BRL",
          }).format(remainingAmount)}
        </p>
      </div>

      <div>
        <Label htmlFor="amount">Valor do Pagamento</Label>
        <Input
          id="amount"
          type="number"
          step="0.01"
          max={remainingAmount}
          value={formData.amount}
          onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
          required
        />
        <p className="text-xs text-muted-foreground mt-1">
          Máximo:{" "}
          {new Intl.NumberFormat("pt-BR", {
            style: "currency",
            currency: "BRL",
          }).format(remainingAmount)}
        </p>
      </div>

      <div>
        <Label htmlFor="paymentMethod">Forma de Pagamento</Label>
        <Select
          value={formData.paymentMethod}
          onValueChange={(value) =>
            setFormData({ ...formData, paymentMethod: value })
          }
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="cash">Dinheiro</SelectItem>
            <SelectItem value="credit_card">Cartão de Crédito</SelectItem>
            <SelectItem value="debit_card">Cartão de Débito</SelectItem>
            <SelectItem value="bank_transfer">Transferência</SelectItem>
            <SelectItem value="pix">PIX</SelectItem>
            <SelectItem value="check">Cheque</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label htmlFor="description">Observações</Label>
        <Input
          id="description"
          value={formData.description}
          onChange={(e) =>
            setFormData({ ...formData, description: e.target.value })
          }
        />
      </div>

      <Button type="submit" disabled={isSubmitting} className="w-full">
        {isSubmitting ? "Registrando..." : "Registrar Pagamento"}
      </Button>
    </form>
  );
}

export default Finances;
