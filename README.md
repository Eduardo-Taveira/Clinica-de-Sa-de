# Vida Clínica

**Sistema web de agendamento médico — teste técnico Full Stack**

Aplicação demonstrativa para cadastro de pacientes, consulta de especialidades e médicos, verificação de horários disponíveis e agendamento de consultas. Os profissionais, registros e unidades do catálogo são **fictícios**.

## Tecnologias

| Camada | Tecnologias |
| --- | --- |
| Frontend | React 19, TypeScript, Vite 6, Tailwind CSS, React Router |
| Backend | Node.js, Express 5, TypeScript, Zod |
| Banco | PostgreSQL 16, Prisma ORM 6 |
| API externa | [Nager.at](https://date.nager.at/) — feriados nacionais brasileiros |
| Ambiente local | Docker Desktop e Docker Compose |

## Funcionalidades

- Cadastro e login de pacientes com sessões via cookie `HttpOnly`.
- Catálogo demonstrativo de **12 especialidades, 14 médicos e 3 unidades**.
- Escolha de especialidade, médico, unidade, data e horário.
- Atendimento das **08h às 18h**, em intervalos de uma hora; último horário às **17h**.
- Bloqueio de datas passadas, finais de semana, feriados nacionais e horários indisponíveis.
- Prevenção de conflito de agendamentos para o mesmo médico no mesmo horário.
- Dashboard, listagem das próprias consultas e cancelamento de consultas futuras.
- Regras de data e hora interpretadas no fuso `America/Sao_Paulo`.

## Pré-requisitos

- [Git](https://git-scm.com/)
- [Node.js](https://nodejs.org/) **20.19 ou superior**, com npm
- [Docker Desktop](https://www.docker.com/products/docker-desktop/) com Docker Compose
- Acesso à internet para instalar dependências e consultar a API de feriados

As instruções abaixo usam **Windows PowerShell**. Em Linux/macOS, utilize `cp` para copiar os arquivos `.env.example`.

## 1. Clonar o repositório

```powershell
git clone https://github.com/Eduardo-Taveira/Clinica-de-Saude.git
cd Clinica-de-Saude
```

Se o repositório estiver privado, solicite acesso antes de cloná-lo.

## 2. Iniciar o backend e banco de dados

Na pasta raiz do projeto, abra o PowerShell e execute:

```powershell
cd backend
Copy-Item .env.example .env
npm ci

docker compose up -d

npx prisma migrate deploy
npm run db:generate
npm run db:seed

npm run dev
```

A API estará disponível em **http://localhost:3333**. Confira **http://localhost:3333/health**; o retorno esperado é `{"status":"ok"}`.

O arquivo `backend/.env.example` contém credenciais exclusivamente demonstrativas, compatíveis com o serviço PostgreSQL definido em `backend/docker-compose.yml`. **Nunca publique seu arquivo `.env` real; altere as credenciais para qualquer ambiente não demonstrativo.**

## 3. Iniciar o frontend

Mantenha o terminal do backend aberto. Em **outro PowerShell**, na pasta raiz do projeto:

```powershell
cd frontend
Copy-Item .env.example .env
npm ci
npm run dev
```

Abra **http://localhost:5173** no navegador. A variável `VITE_API_URL` aponta por padrão para `http://localhost:3333`. Utilize `localhost` nos dois serviços; a API espera `FRONTEND_ORIGIN=http://localhost:5173`.

## 4. Testar a aplicação

1. Acesse `http://localhost:5173/cadastro` e crie uma conta de paciente.
2. Faça login e abra o painel.
3. Na tela de agendamento, selecione uma especialidade, um médico, uma unidade e uma data futura.
4. Escolha um dos horários disponíveis e confirme.
5. Em **Minhas consultas**, visualize a reserva e teste o cancelamento de uma consulta futura.
6. Confira que finais de semana, feriados nacionais e horários ocupados não podem ser reservados.

O seed cadastra médicos e unidades **fictícios**, mas não cria uma conta de paciente. Use a tela de cadastro para isso.

## 5. Executar testes e builds

No terminal do backend, dentro de `backend/`:

```powershell
npm test
npm run build
```

No terminal do frontend, dentro de `frontend/`:

```powershell
npm run typecheck
npm run build
```

Os testes automatizados atuais do backend verificam regras de negócio; **não equivalem a testes de ponta a ponta** envolvendo banco, API e navegador.

## Endpoints REST principais

| Método | Endpoint | Finalidade |
| --- | --- | --- |
| `GET` | `/health` | Saúde da API |
| `POST` | `/auth/register` | Cadastro de paciente |
| `POST` | `/auth/login` | Login |
| `GET` | `/auth/me` | Sessão atual |
| `POST` | `/auth/logout` | Logout |
| `GET` | `/specialties` | Especialidades |
| `GET` | `/locations` | Unidades |
| `GET` | `/doctors` | Médicos; aceita filtros `specialtyId` e `locationId` |
| `GET` | `/available?date=AAAA-MM-DD` | Horários disponíveis; aceita também `doctorId` e `locationId` |
| `POST` | `/appointments` | Agendar consulta |
| `GET` | `/appointments` | Minhas consultas |
| `DELETE` | `/appointments/:id` | Cancelar consulta futura |

Com exceção de `/health`, `/auth/register` e `/auth/login`, os endpoints exigem autenticação por sessão.

Exemplo de `POST /appointments` com médico e unidade (use os UUIDs fornecidos pelo catálogo):

```json
{
  "date": "2026-11-03",
  "time": "09:00",
  "doctorId": "UUID_DO_MEDICO",
  "locationId": "UUID_DA_UNIDADE"
}
```

O backend também mantém compatibilidade com o contrato original sem os identificadores, usando o médico e a unidade padrão.

## Estrutura de pastas

```text
Clinica-de-Saude/
├── backend/
│   ├── prisma/                 # Schema, migrations e seed
│   ├── src/
│   │   ├── lib/
│   │   ├── middlewares/
│   │   ├── routes/
│   │   ├── services/
│   │   └── tests/
│   ├── docker-compose.yml
│   ├── .env.example
│   └── package.json
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── components/
│   │   ├── contexts/
│   │   ├── lib/
│   │   └── pages/
│   ├── .env.example
│   └── package.json
└── README.md
```

## Problemas comuns

| Sintoma | Verifique |
| --- | --- |
| Banco não conecta | Docker Desktop ativo; `docker compose ps` dentro de `backend/`; valor de `DATABASE_URL` |
| Tabelas inexistentes | Execute `npx prisma migrate deploy` dentro de `backend/` |
| Catálogo vazio | Execute `npm run db:seed` dentro de `backend/` |
| Erro de CORS ou cookie | Use `localhost:5173` e `localhost:3333`; confira `FRONTEND_ORIGIN` |
| Horários não carregam | API ativa, login válido e disponibilidade da Nager.at |
| Portas `5432`, `3333` ou `5173` ocupadas | Encerre processos conflitantes ou adapte as configurações |
| `npm` não reconhecido | Instale/atualize Node.js e reinicie o terminal |

## Fluxo de desenvolvimento

Este projeto utiliza **GitFlow**: `main` para versões estáveis, `develop` para integração e branches `feature/*` para novas funcionalidades, com mensagens de commit em português e inglês.

---

**Projeto de avaliação técnica.** Os dados profissionais e as unidades exibidas são fictícios; este software não deve ser usado em operação clínica real sem adaptações, validação e requisitos apropriados de segurança e privacidade.
