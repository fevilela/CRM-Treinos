import { useState } from "react";
import { StudentLogin } from "./student-login";
import { StudentLayout } from "@/components/layout/student-layout";
import type { Student } from "@shared/schema";

export function StudentApp() {
  const [student, setStudent] = useState<Student | null>(null);

  const handleLoginSuccess = (studentData: Student) => {
    setStudent(studentData);
  };

  const handleLogout = () => {
    setStudent(null);
  };

  if (student) {
    return <StudentLayout student={student} onLogout={handleLogout} />;
  }

  return <StudentLogin onLoginSuccess={handleLoginSuccess} />;
}
