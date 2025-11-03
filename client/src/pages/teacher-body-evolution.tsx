import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import Header from "@/components/layout/header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { StudentBodyEvolution } from "@/pages/student-body-evolution";
import type { Student } from "@shared/schema";
import { Users } from "lucide-react";

export default function TeacherBodyEvolution() {
  const { user } = useAuth();
  const [selectedStudentId, setSelectedStudentId] = useState<string>("");

  const { data: students = [], isLoading: studentsLoading } = useQuery<
    Student[]
  >({
    queryKey: ["/api/students"],
    enabled: !!user,
  });

  const selectedStudent = students.find((s) => s.id === selectedStudentId);

  return (
    <div className="space-y-6">
      <Header
        title="Evolução Corporal dos Alunos"
        subtitle="Acompanhe a evolução física dos alunos"
      />

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Selecione um Aluno
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Select
            value={selectedStudentId}
            onValueChange={setSelectedStudentId}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Escolha um aluno para visualizar a evolução" />
            </SelectTrigger>
            <SelectContent>
              {studentsLoading ? (
                <div className="py-2 px-4 text-sm text-muted-foreground">
                  Carregando alunos...
                </div>
              ) : students.length === 0 ? (
                <div className="py-2 px-4 text-sm text-muted-foreground">
                  Nenhum aluno cadastrado
                </div>
              ) : (
                students.map((student) => (
                  <SelectItem key={student.id} value={student.id}>
                    {student.name}
                  </SelectItem>
                ))
              )}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {selectedStudent && <StudentBodyEvolution student={selectedStudent} />}

      {!selectedStudent && !studentsLoading && (
        <Card>
          <CardContent className="py-12">
            <div className="text-center text-muted-foreground">
              <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>
                Selecione um aluno acima para visualizar sua evolução corporal
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
