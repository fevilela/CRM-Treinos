import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { StudentLogin } from "./student-login";
import { StudentLayout } from "@/components/layout/student-layout";
import type { Student } from "@shared/schema";

export function StudentApp() {
  const queryClient = useQueryClient();

  // Busca o student record baseado no usuário autenticado
  const {
    data: student,
    isLoading: studentLoading,
    error,
    refetch,
  } = useQuery<Student>({
    queryKey: ["/api/auth/student/me"],
    queryFn: async () => {
      const response = await fetch("/api/auth/student/me", {
        credentials: "include",
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const result = await response.json();
      if (result.success && result.student) {
        return result.student;
      }
      throw new Error("Invalid response format");
    },
    retry: false,
  });

  const handleLoginSuccess = (studentData: Student) => {
    // Atualiza os dados no cache da query
    queryClient.setQueryData(["/api/auth/student/me"], studentData);
  };

  const handleLogout = () => {
    // Limpa o cache e força uma nova busca
    queryClient.removeQueries({ queryKey: ["/api/auth/student/me"] });
    queryClient.removeQueries({ queryKey: ["/api/auth/user"] });
    window.location.href = "/";
  };

  if (studentLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error || !student) {
    return <StudentLogin onLoginSuccess={handleLoginSuccess} />;
  }

  return <StudentLayout student={student} onLogout={handleLogout} />;
}
