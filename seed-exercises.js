// Script para criar exercícios padrão no banco de dados
import fetch from 'node-fetch';

const exerciseTemplates = [
  {
    name: "Supino Reto",
    description: "Exercício básico para peito e tríceps",
    videoUrl: "https://www.youtube.com/watch?v=gRVjAtPip0Y",
    muscleGroups: ["peito", "tríceps"],
    equipment: "Barra",
    difficulty: "beginner"
  },
  {
    name: "Agachamento",
    description: "Exercício fundamental para pernas e glúteos",
    videoUrl: "https://www.youtube.com/watch?v=Dy28eq2PjcM",
    muscleGroups: ["pernas", "glúteos"],
    equipment: "Peso livre",
    difficulty: "beginner"
  },
  {
    name: "Puxada na Polia",
    description: "Exercício para costas e bíceps",
    videoUrl: "https://www.youtube.com/watch?v=CAwf7n6Luuc",
    muscleGroups: ["costas", "bíceps"],
    equipment: "Polia",
    difficulty: "beginner"
  },
  {
    name: "Desenvolvimento com Halteres",
    description: "Exercício para ombros",
    videoUrl: "https://www.youtube.com/watch?v=qEwKCR5JCog",
    muscleGroups: ["ombros"],
    equipment: "Halteres",
    difficulty: "intermediate"
  },
  {
    name: "Rosca Direta",
    description: "Exercício para bíceps",
    videoUrl: "https://www.youtube.com/watch?v=ykJmrZ5v0Oo",
    muscleGroups: ["bíceps"],
    equipment: "Halteres",
    difficulty: "beginner"
  },
  {
    name: "Tríceps na Polia",
    description: "Exercício para tríceps",
    videoUrl: "https://www.youtube.com/watch?v=2-LAMcpzODU",
    muscleGroups: ["tríceps"],
    equipment: "Polia",
    difficulty: "beginner"
  },
  {
    name: "Leg Press",
    description: "Exercício para pernas com segurança",
    videoUrl: "https://www.youtube.com/watch?v=IZxyjW7MPJQ",
    muscleGroups: ["pernas"],
    equipment: "Máquina",
    difficulty: "beginner"
  },
  {
    name: "Remada Curvada",
    description: "Exercício composto para costas",
    videoUrl: "https://www.youtube.com/watch?v=FWJR5Ve8bnQ",
    muscleGroups: ["costas", "bíceps"],
    equipment: "Barra",
    difficulty: "intermediate"
  }
];

async function seedExercises() {
  console.log('Criando exercícios padrão...');
  
  for (const exercise of exerciseTemplates) {
    try {
      const response = await fetch(`http://0.0.0.0:3000/api/exercise-templates`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(exercise)
      });
      
      if (response.ok) {
        console.log(`✓ Exercício criado: ${exercise.name}`);
      } else {
        console.log(`✗ Erro ao criar: ${exercise.name}`, await response.text());
      }
    } catch (error) {
      console.log(`✗ Erro de conexão para: ${exercise.name}`, error.message);
    }
  }
  
  console.log('Concluído!');
}

seedExercises();