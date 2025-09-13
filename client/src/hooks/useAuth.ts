import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

export function useAuth() {
  const queryClient = useQueryClient();

  const {
    data: user,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["/api/auth/user"],
    queryFn: async () => {
      // Primeiro tenta verificar professor
      try {
        const response = await apiRequest("GET", "/api/auth/user");
        return await response.json();
      } catch (teacherError) {
        // Se falhar, tenta verificar estudante
        try {
          const response = await fetch("/api/auth/student/me", {
            credentials: "include",
          });

          if (response.ok) {
            const result = await response.json();
            if (result.success && result.student) {
              // Converter estudante para formato de usuário
              return {
                id: result.student.id,
                email: result.student.email,
                firstName:
                  result.student.name.split(" ")[0] || result.student.name,
                lastName:
                  result.student.name.split(" ").slice(1).join(" ") || "",
                role: "student" as const,
              };
            }
          }
          throw new Error("No valid session found");
        } catch (studentError) {
          throw teacherError; // Retorna o erro original se ambos falharem
        }
      }
    },
    retry: false,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      // Logout funciona para ambos professores e estudantes
      await apiRequest("POST", "/api/logout");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      window.location.reload();
    },
  });

  const logout = () => {
    logoutMutation.mutate();
  };

  return {
    user,
    isLoading,
    isAuthenticated: !!user && !error,
    logout,
    isLoggingOut: logoutMutation.isPending,
  };
}
