import fetch from "node-fetch";

export interface CPFData {
  valid: boolean;
  name?: string;
  dateOfBirth?: string;
  error?: string;
}

export async function validateCPF(cpf: string): Promise<boolean> {
  const cleanCPF = cpf.replace(/\D/g, "");

  if (cleanCPF.length !== 11) {
    return false;
  }

  if (/^(\d)\1{10}$/.test(cleanCPF)) {
    return false;
  }

  let sum = 0;
  let remainder;

  for (let i = 1; i <= 9; i++) {
    sum += parseInt(cleanCPF.substring(i - 1, i)) * (11 - i);
  }

  remainder = (sum * 10) % 11;
  if (remainder === 10 || remainder === 11) remainder = 0;
  if (remainder !== parseInt(cleanCPF.substring(9, 10))) return false;

  sum = 0;
  for (let i = 1; i <= 10; i++) {
    sum += parseInt(cleanCPF.substring(i - 1, i)) * (12 - i);
  }

  remainder = (sum * 10) % 11;
  if (remainder === 10 || remainder === 11) remainder = 0;
  if (remainder !== parseInt(cleanCPF.substring(10, 11))) return false;

  return true;
}

export async function consultarCPF(cpf: string): Promise<CPFData> {
  const cleanCPF = cpf.replace(/\D/g, "");

  if (!validateCPF(cleanCPF)) {
    return {
      valid: false,
      error: "CPF inválido",
    };
  }

  try {
    const url = `https://scpa-backend.saude.gov.br/public/scpa-usuario/validacao-cpf/${cleanCPF}`;
    const response = await fetch(url, {
      method: "GET",
      headers: {
        Accept: "application/json",
      },
      timeout: 10000,
    } as any);

    if (response.ok) {
      return {
        valid: true,
      };
    } else {
      const data = (await response.json()) as any;
      return {
        valid: false,
        error: data?.[0]?.message || "CPF não encontrado na Receita Federal",
      };
    }
  } catch (error: any) {
    console.error("Erro ao consultar CPF:", error);
    return {
      valid: false,
      error:
        "Erro ao consultar CPF no servidor. Verifique sua conexão e tente novamente.",
    };
  }
}

export function formatCPF(cpf: string): string {
  const cleanCPF = cpf.replace(/\D/g, "");

  if (cleanCPF.length !== 11) {
    return cpf;
  }

  return cleanCPF.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
}
