# CRM Treinos MP

Sistema completo de gerenciamento para personal trainers. Gerencie alunos, crie treinos personalizados e acompanhe o progresso com evolução corporal.

## 🚀 Funcionalidades

- ✅ Sistema de autenticação integrado
- ✅ Dashboard com estatísticas em tempo real
- ✅ Gerenciamento completo de alunos (CRUD)
- ✅ Criação de treinos personalizados com exercícios
- ✅ Acompanhamento de progresso e evolução corporal
- ✅ Interface moderna e responsiva
- ✅ Banco de dados PostgreSQL

## 🛠️ Tecnologias Utilizadas

### Frontend

- **React 18** com TypeScript
- **Wouter** para roteamento
- **TanStack Query** para gerenciamento de estado
- **shadcn/ui** + **Tailwind CSS** para interface
- **React Hook Form** + **Zod** para formulários
- **Vite** como build tool

### Backend

- **Express.js** com TypeScript
- **Drizzle ORM** para banco de dados
- **PostgreSQL** (Neon)
- **OpenID Connect** para autenticação
- **Passport.js** para sessões

## 📋 Pré-requisitos

- Node.js 18+ instalado
- PostgreSQL (ou conta no Neon Database)
- Git

## 🚀 Como executar localmente

### 1. Clone o repositório

```bash
git clone [URL_DO_SEU_REPOSITORIO]
cd crm-treinos-mp
```

### 2. Instale as dependências

```bash
npm install
```

### 3. Configure as variáveis de ambiente

Crie um arquivo `.env` na raiz do projeto com:

```env
# Database
DATABASE_URL="sua_url_do_postgresql"

# Authentication (para desenvolvimento local)
SESSION_SECRET="sua_chave_secreta_super_segura"
REPL_ID="seu_repl_id"
ISSUER_URL="https://replit.com/oidc"
REPLIT_DOMAINS="localhost:3000"
```

### 4. Execute as migrações do banco

```bash
npm run db:push
```

### 5. Inicie o servidor de desenvolvimento

```bash
npm run dev
```

O sistema estará disponível em `http://localhost:3000`

## 📁 Estrutura do Projeto

```
├── client/                 # Frontend React
│   ├── src/
│   │   ├── components/     # Componentes reutilizáveis
│   │   │   ├── dashboard/  # Componentes do dashboard
│   │   │   ├── layout/     # Layout (sidebar, header)
│   │   │   ├── modals/     # Modais de formulários
│   │   │   └── ui/         # Componentes base (shadcn/ui)
│   │   ├── hooks/          # React hooks customizados
│   │   ├── lib/            # Utilitários e configurações
│   │   └── pages/          # Páginas da aplicação
│   └── index.html
├── server/                 # Backend Express
│   ├── db.ts              # Configuração do banco
│   ├── routes.ts          # Rotas da API
│   ├── storage.ts         # Camada de dados
│   └── replitAuth.ts      # Configuração de autenticação
├── shared/                # Código compartilhado
│   └── schema.ts          # Schema do banco e tipos
└── package.json
```

## 🗄️ Schema do Banco de Dados

- **users** - Usuários (personal trainers)
- **students** - Alunos
- **workouts** - Treinos
- **exercises** - Exercícios dos treinos
- **workout_sessions** - Sessões de treino realizadas
- **exercise_performances** - Performance dos exercícios
- **body_measurements** - Medidas corporais
- **sessions** - Sessões de autenticação

## 📱 Funcionalidades Detalhadas

### Dashboard

- Estatísticas em tempo real (total de alunos, treinos ativos, taxa de adesão)
- Gráfico de progresso dos treinos
- Visualização de evolução corporal
- Lista de alunos recentes
- Feed de atividades

### Gerenciamento de Alunos

- Cadastro completo com dados pessoais
- Campos para objetivos e condições médicas
- Sistema de status (ativo, inativo, suspenso)
- Busca e filtragem
- Operações CRUD completas

### Criação de Treinos

- Nome e categoria do treino
- Exercícios detalhados (séries, repetições, peso, descanso)
- Sistema de ordenação drag-and-drop
- Categorias pré-definidas (Peito/Tríceps, Costas/Bíceps, Pernas, etc.)

### Acompanhamento

- Registro de sessões de treino
- Performance individual por exercício
- Evolução das cargas e repetições
- Medidas corporais e progresso físico

## 🔧 Scripts Disponíveis

- `npm run dev` - Inicia o servidor de desenvolvimento
- `npm run build` - Cria build de produção
- `npm run db:push` - Aplica mudanças no schema do banco
- `npm run db:studio` - Abre o Drizzle Studio para visualizar dados

## 🚀 Deploy

O projeto está configurado para deploy no Replit, mas pode ser adaptado para outras plataformas:

- **Vercel/Netlify** - Frontend
- **Railway/Heroku** - Backend
- **Neon/Supabase** - Banco de dados

## 🤝 Contribuição

1. Fork o projeto
2. Crie uma branch para sua feature (`git checkout -b feature/nova-feature`)
3. Commit suas mudanças (`git commit -am 'Adiciona nova feature'`)
4. Push para a branch (`git push origin feature/nova-feature`)
5. Abra um Pull Request

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo `LICENSE` para mais detalhes.

## 📞 Suporte

Se encontrar algum problema ou tiver dúvidas, abra uma issue no repositório.

---

**Desenvolvido com ❤️ para personal trainers**#
