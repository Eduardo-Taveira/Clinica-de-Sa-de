# Vida Clínica

**Sistema web de agendamento médico — teste técnico Full Stack**

Aplicação demonstrativa para cadastro de pacientes, consulta de especialidades e médicos, verificação de horários disponíveis e agendamento de consultas. Os profissionais, registros e unidades do catálogo são **fictícios**.

**[Acessar demonstração online — Vida Clínica](https://clinica-de-saude.pages.dev/)**

A versão online está publicada na **Cloudflare Pages**, com API hospedada no **Render** e banco **Neon PostgreSQL**. Para avaliar o projeto sem instalar nada, utilize o link acima e crie uma conta fictícia. Para executar localmente com um banco independente, siga as instruções abaixo.

## Tecnologias

| Camada | Tecnologias |
| --- | --- |
| Frontend | React 19, TypeScript, Vite 6, Tailwind CSS 3, React Router 7 |
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
- [Docker Desktop](https://www.docker.com/products/docker-desktop/) com Docker Compose **(recomendado)** ou PostgreSQL 16 instalado localmente
- Acesso à internet para instalar dependências e consultar a API de feriados

As instruções abaixo usam **Windows PowerShell**. Em Linux/macOS, utilize `cp` para copiar os arquivos `.env.example`. **Este é o guia de instalação para o recrutador:** não é necessário realizar deploy nem ter uma conta previamente cadastrada; o projeto roda localmente com backend, frontend e PostgreSQL.

## 1. Clonar o repositório

```powershell
git clone https://github.com/Eduardo-Taveira/Clinica-de-Saude.git
cd Clinica-de-Saude
```

Se o repositório estiver privado, solicite acesso antes de cloná-lo.

## 2. Configurar o PostgreSQL e iniciar o backend

**Escolha apenas uma das opções a seguir para o banco de dados.** A opção A (Docker Compose) é a mais simples para reproduzir o projeto e não exige instalar PostgreSQL no Windows. A opção B é destinada a quem já utiliza PostgreSQL nativo. Ambas executam o backend em `http://localhost:3333` e **não acessam o banco da demonstração online**.

### Opção A — PostgreSQL com Docker Compose (recomendado)

1. Abra o **Docker Desktop** e aguarde o serviço ficar ativo.
2. Na pasta raiz do repositório, abra o **PowerShell** e execute:

```powershell
cd backend
Copy-Item .env.example .env
npm ci
docker compose up -d
docker compose ps
```

O arquivo `backend/docker-compose.yml` configura automaticamente um PostgreSQL 16 com as **credenciais demonstrativas locais** abaixo:

| Configuração | Valor usado apenas no ambiente local |
| --- | --- |
| Host / porta | `localhost:5432` |
| Banco | `clinica_agendamentos` |
| Usuário | `clinica_user` |
| Senha | `clinica_password` |
| String de conexão | `postgresql://clinica_user:clinica_password@localhost:5432/clinica_agendamentos?schema=public` |

Esses valores já correspondem ao `DATABASE_URL` de `backend/.env.example`; **não é necessário criar o banco ou usuário manualmente** no Docker. Aguarde o contêiner estar saudável (`healthy`) em `docker compose ps`.

Para verificar a conexão e identificar o banco atendido pelo contêiner:

```powershell
docker compose exec db psql -U clinica_user -d clinica_agendamentos -c "SELECT current_database(), current_user;"
```

Se a porta `5432` já estiver em uso por um PostgreSQL instalado no Windows ou por outro contêiner, pare o serviço conflitante **ou escolha a opção B**. Não execute os dois servidores na mesma porta. Para investigar o Docker: `docker compose ps` e `docker compose logs db --tail 30`. Para parar o banco ao terminar, use `docker compose down`; **não use `docker compose down -v`**, pois `-v` remove também o volume com os dados.

### Opção B — PostgreSQL instalado no Windows (alternativa)

Se você já possui PostgreSQL 16 instalado, **não inicie o Docker Compose desse projeto**. Verifique que o serviço PostgreSQL está ativo na porta `5432`. Na pasta raiz do repositório:

```powershell
cd backend
Copy-Item .env.example .env
npm ci
psql -h localhost -U postgres -d postgres
```

Após informar a senha administrativa da sua instalação, execute no terminal do `psql` **somente se esse usuário e banco ainda não existirem**:

```sql
CREATE ROLE clinica_user WITH LOGIN PASSWORD 'senha_teste_local';
CREATE DATABASE clinica_agendamentos OWNER clinica_user;
```

Saia do `psql` com `\q`. Em `backend/.env`, ajuste a conexão para a senha criada:

```dotenv
DATABASE_URL="postgresql://clinica_user:senha_teste_local@localhost:5432/clinica_agendamentos?schema=public"
```

Conserve `FRONTEND_ORIGIN=http://localhost:5173` e `NODE_ENV=development` do arquivo de exemplo. **Se utilizar nomes, porta ou senha diferentes, ajuste `DATABASE_URL` para corresponder.** Senhas com caracteres especiais em URLs devem ser codificadas (percent-encoding). Os nomes e senhas acima são **apenas exemplos locais**, nunca credenciais para produção.

Valide a conexão com o usuário da aplicação:

```powershell
psql -h localhost -U clinica_user -d clinica_agendamentos -c "SELECT current_database(), current_user;"
```

Se o PowerShell disser que `psql` não é reconhecido, use o executável do PostgreSQL pelo caminho completo, por exemplo `& 'C:\Program Files\PostgreSQL\16\bin\psql.exe' -h localhost -U postgres -d postgres` (ajuste a versão/pasta). Esse erro **não significa que o servidor PostgreSQL esteja desligado**.

### Finalizar a configuração (ambas as opções)

Com o banco iniciado e `backend/.env` configurado, ainda dentro da pasta `backend/`, execute:

```powershell
npx prisma migrate deploy
npx prisma migrate status
npm run db:generate
npm run db:seed
npm run dev
```

- `migrate deploy` aplica as migrations versionadas e cria as tabelas; `migrate status` verifica seu estado.
- `db:generate` gera o Prisma Client utilizado pela API.
- `db:seed` cadastra as **12 especialidades, 14 médicos e 3 unidades fictícias**. O seed não cria pacientes; o avaliador faz isso pela tela de cadastro.
- `npm run dev` inicia a API em **http://localhost:3333**. Abra [http://localhost:3333/health](http://localhost:3333/health) e confira `{"status":"ok"}`. Esse endpoint confirma apenas que o processo HTTP está respondendo, **não valida sozinho a conexão com o banco**.

**Soluções rápidas:** erro Prisma `P1000` indica falha de autenticação (confira usuário/senha e a instância atendendo a porta `5432`); `P1001` sugere servidor/porta inacessível. Se houver erro de permissões, confira se `clinica_user` é proprietário do banco ou possui as permissões necessárias para criar tabelas. Se o catálogo aparecer vazio, revise as migrations e execute `npm run db:seed`. **Não suba `backend/.env` para o GitHub.**

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

Os cinco testes automatizados atuais do backend verificam regras de negócio; **não equivalem a uma suíte completa de integração ou de ponta a ponta**. Cadastro, login, dashboard, agendamento e cancelamento também foram validados manualmente no navegador durante o desenvolvimento.

## Segurança e validação

A aplicação é uma **demonstração para avaliação técnica**, construída com controles como:

- Senhas armazenadas como hash bcrypt; registro público cria somente pacientes.
- Sessões persistidas no banco com tokens aleatórios; apenas o hash do token é armazenado. Cookie `HttpOnly`, `SameSite=Lax` e `Secure` quando `NODE_ENV=production`.
- Autenticação obrigatória e consulta/cancelamento limitados ao paciente dono da reserva.
- Helmet, CORS restrito à origem configurada e limite de requisições nas rotas de autenticação.
- Verificação de origem para requisições `POST`, `PUT`, `PATCH` e `DELETE`: o cabeçalho `Origin` deve ser **exatamente** o valor de `FRONTEND_ORIGIN` (no ambiente local, `http://localhost:5173`). Requisições de escrita sem esse cabeçalho retornam `403`. O navegador envia o cabeçalho automaticamente; ao testar a API pelo PowerShell, Postman ou curl, informe-o manualmente.
- Validação Zod, restrição única de horário por médico no banco de dados e bloqueio de datas/feriados indisponíveis.

**Resultados obtidos em 14/10/2026 no ambiente local de validação:**

| Verificação | Resultado |
| --- | --- |
| Testes de regras de negócio do backend (`npm test`) | 5/5 aprovados |
| Auditoria automatizada da API local | 33/33 verificações aprovadas; 0 falhas |
| Build do backend, typecheck e build do frontend | Concluídos |
| `npm audit` no backend | 0 vulnerabilidades reportadas |
| `npm audit --omit=dev` no frontend | 0 vulnerabilidades reportadas |
| `npm audit` completo no frontend | 7 avisos remanescentes (5 altos e 2 moderados), associados a ferramentas de desenvolvimento do Tailwind CSS 3 |

A auditoria de 33 verificações foi executada **localmente por script auxiliar, não incluído neste repositório**. Seus resultados não garantem ausência de vulnerabilidades e não substituem análise profissional ou testes de produção. Para auditorar novamente as dependências, execute `npm audit` nas pastas `backend/` e `frontend/`.

**Uso e privacidade:** o catálogo, médicos e unidades são fictícios. Use dados de teste, não cadastros reais de pacientes. O `.env.example` e o Docker Compose contêm credenciais demonstrativas e **não devem ser reutilizados em produção**. Uma implantação real requer HTTPS, gerenciamento de segredos, configuração de cookies/origens, controles operacionais, privacidade e verificações adicionais.

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
| Resposta `403 Origem não permitida` em requisições manuais de escrita | Envie `Origin: http://localhost:5173` em `POST`/`PUT`/`PATCH`/`DELETE`; o valor deve coincidir com `FRONTEND_ORIGIN` |
| Horários não carregam | API ativa, login válido e disponibilidade da Nager.at |
| Portas `5432`, `3333` ou `5173` ocupadas | Encerre processos conflitantes ou adapte as configurações |
| `npm` não reconhecido | Instale/atualize Node.js e reinicie o terminal |

## Fluxo de desenvolvimento

Este projeto utiliza **GitFlow**: `main` para versões estáveis, `develop` para integração e branches `feature/*` para novas funcionalidades, com mensagens de commit em português e inglês.

---

**Projeto de avaliação técnica.** Os dados profissionais e as unidades exibidas são fictícios; este software não deve ser usado em operação clínica real sem adaptações, validação e requisitos apropriados de segurança e privacidade.
