# Clínica Agendamento — Backend

API REST do teste técnico de Estagiário Full Stack. Stack: Node.js 20+, Express 5, TypeScript, PostgreSQL 16 e Prisma 6.19.3.

## Começar no Windows (PowerShell)

Pré-requisitos: **Node.js 20+**, **npm**, **PostgreSQL 16** (instalado localmente ou via Docker Desktop) e acesso à internet para instalar dependências e consultar feriados.

```powershell
cd backend
Copy-Item .env.example .env
npm install
```

Se usar Docker Desktop, inicialize o banco em outra janela:

```powershell
docker compose up -d
```

Se usar PostgreSQL instalado localmente, crie o banco e usuário descritos em `docker-compose.yml` e ajuste `DATABASE_URL` no arquivo `.env`. **Nunca suba `.env` para o GitHub.**

Crie as tabelas e inicie a API:

```powershell
npm run db:migrate
npm run dev
```

A API estará em **http://localhost:3333**. Teste `http://localhost:3333/health`.

## Rotas

| Método | Endpoint | Login obrigatório | Descrição |
|---|---|---|---|
| GET | `/health` | Não | Verifica funcionamento básico |
| POST | `/auth/register` | Não | Cria paciente, inicia sessão |
| POST | `/auth/login` | Não | Faz login, inicia sessão |
| GET | `/auth/me` | Sim | Retorna o usuário autenticado |
| POST | `/auth/logout` | Sim | Encerra sessão |
| GET | `/available?date=AAAA-MM-DD` | Sim | Horários livres; motivos de bloqueio |
| POST | `/appointments` | Sim | Marca consulta |
| GET | `/appointments` | Sim | Lista apenas as próprias consultas |
| DELETE | `/appointments/:id` | Sim | Cancela consulta futura pertencente ao paciente e libera o horário (204) |

Corpos JSON:

```json
{"name":"Paciente Exemplo","email":"paciente@example.com","password":"SenhaForte123!"}
```

`POST /auth/register`. Para entrar novamente: `POST /auth/login` com `email` e `password`.

`POST /appointments`:

```json
{"date":"2026-11-03","time":"09:00"}
```

A resposta 201 traz um `id` de confirmação e os dados da consulta. O cookie de sessão é HttpOnly; o navegador precisa enviar `credentials: 'include'` ao chamar a API no React. Para desenvolvimento local, frontend em `http://localhost:5173`.

## Testar manualmente no PowerShell

O PowerShell pode conservar o cookie no objeto `WebRequestSession`:

```powershell
$base = 'http://localhost:3333'
$body = @{ name='Paciente Exemplo'; email='paciente2@example.com'; password='SenhaForte123!' } | ConvertTo-Json
Invoke-RestMethod -Uri "$base/auth/register" -Method Post -Body $body -ContentType 'application/json' -SessionVariable sess
Invoke-RestMethod -Uri "$base/available?date=2026-11-03" -WebSession $sess
$appointment = @{ date='2026-11-03'; time='09:00' } | ConvertTo-Json
Invoke-RestMethod -Uri "$base/appointments" -Method Post -Body $appointment -ContentType 'application/json' -WebSession $sess
Invoke-RestMethod -Uri "$base/appointments" -WebSession $sess
```

Se a data de exemplo já passou quando você executar, use uma **data futura em dia útil e que não seja feriado**, e escolha um horário retornado por `/available`.

Cancelamento (somente uma consulta futura do próprio paciente):

```powershell
Invoke-RestMethod -Uri "$base/appointments/SEU-ID" -Method Delete -WebSession $sess
```

Retorna **204** em sucesso, **404** quando a consulta não pertence ao usuário ou não existe, **409** para consulta iniciada/passada. O cancelamento remove o registro, liberando o horário. Para manter histórico de cancelamentos numa evolução futura, será necessário adicionar estados e auditoria.

## Regras de negócio

- Atendimento: 08:00–18:00; dez horários de uma hora, de 08:00 até 17:00.
- Não agenda em dias passados, finais de semana, feriados nacionais ou horários passados/ocupados.
- Validação de feriados no backend via `https://date.nager.at/api/v3/PublicHolidays/{ano}/BR`, cobrindo o endpoint **2026/BR** indicado no PDF. Cache em memória por 12h. Falha na API externa devolve 503; a reserva não é liberada sem validação.
- Interpreta a data/hora de agendamento no fuso `America/Sao_Paulo`; armazena dia e início do slot separadamente no PostgreSQL.
- Restrição `@@unique([date,startTime])` garante que duas pessoas não consigam reservar o mesmo slot ao mesmo tempo.
- Apenas feriados **nacionais** (`global=true`) são bloqueados; para feriados estaduais/municipais, seria necessário informar a localidade da clínica e ampliar a regra.
- Cada usuário vê apenas os agendamentos da própria conta. Papel `ADMIN` reservado para extensão futura; registro público não permite cadastrar administradores.

## Executar testes e compilar

```powershell
npm test
npm run build
npm run db:studio
```

`npm test` testa regras puras. Para executar testes reais de integração é necessário configurar banco e rede; ainda não foram incluídos nesta primeira versão.

## Segurança e publicação

- Senhas salvas como hash bcrypt (custo 12), não em texto puro.
- Sessões persistidas no banco; cookie aleatório HttpOnly, `SameSite=Lax`, com `Secure` em produção, expira em sete dias; no banco apenas o **hash** do token.
- Validação de entrada, Helmet, CORS restrito ao frontend, limite de requisições na autenticação e verificação básica de origem em mutações.
- Para publicar, configure HTTPS, origem do frontend, variáveis de ambiente fortes e proxy/mesmo site; a configuração foi pensada inicialmente para **localhost**. Auditoria adicional, CSRF dedicado, observabilidade, limpeza periódica de sessões e testes de integração ficam para evolução de produção.

## O que vem depois

Frontend React: login/cadastro, rota protegida, calendário e página de consultas. Opcional depois: painel de administrador.
