# Vida Clínica — Backend

API REST do teste técnico de Estagiário Full Stack. Stack: Node.js 20.19+, Express 5, TypeScript, PostgreSQL 16 e Prisma 6.19.3.

## Começar no Windows (PowerShell)

Pré-requisitos: **Node.js 20.19+**, **npm**, **PostgreSQL 16** (instalado localmente ou via Docker Desktop) e acesso à internet para instalar dependências e consultar feriados.

```powershell
cd backend
Copy-Item .env.example .env
npm ci
```

Se usar Docker Desktop, inicialize o banco em outra janela:

```powershell
docker compose up -d
```

Se usar PostgreSQL instalado localmente, crie o banco e usuário descritos em `docker-compose.yml` e ajuste `DATABASE_URL` no arquivo `.env`. **Nunca suba `.env` para o GitHub.**

Crie as tabelas e inicie a API:

```powershell
npx prisma migrate deploy
npm run db:generate
npm run db:seed
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
| GET | `/specialties` | Sim | Lista especialidades disponíveis |
| GET | `/locations` | Sim | Lista unidades fictícias |
| GET | `/doctors` | Sim | Lista médicos, com filtros opcionais |
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

O PowerShell pode conservar o cookie no objeto `WebRequestSession`. **Após o reforço de CSRF, todos os métodos de escrita precisam do cabeçalho `Origin` autorizado.** O exemplo abaixo usa a mesma origem do frontend local (`FRONTEND_ORIGIN=http://localhost:5173`):

```powershell
$base = 'http://localhost:3333'
$headers = @{ Origin = 'http://localhost:5173' }
$emailTeste = "paciente.$([guid]::NewGuid().ToString('N'))@example.com"
$body = @{ name='Paciente Exemplo'; email=$emailTeste; password='SenhaForte123!' } | ConvertTo-Json
Invoke-RestMethod -Uri "$base/auth/register" -Method Post -Body $body -ContentType 'application/json' -Headers $headers -SessionVariable sess
Invoke-RestMethod -Uri "$base/available?date=2026-11-03" -WebSession $sess
$appointment = @{ date='2026-11-03'; time='09:00' } | ConvertTo-Json
Invoke-RestMethod -Uri "$base/appointments" -Method Post -Body $appointment -ContentType 'application/json' -Headers $headers -WebSession $sess
Invoke-RestMethod -Uri "$base/appointments" -WebSession $sess
```

Se a data de exemplo já passou quando você executar, use uma **data futura em dia útil e que não seja feriado**, e escolha um horário retornado por `/available`.

Cancelamento (somente uma consulta futura do próprio paciente):

```powershell
Invoke-RestMethod -Uri "$base/appointments/SEU-ID" -Method Delete -Headers $headers -WebSession $sess
```

Retorna **204** em sucesso, **404** quando a consulta não pertence ao usuário ou não existe, **409** para consulta iniciada/passada. O cancelamento remove o registro, liberando o horário. Para manter histórico de cancelamentos numa evolução futura, será necessário adicionar estados e auditoria.

## Regras de negócio

- Atendimento: 08:00–18:00; dez horários de uma hora, de 08:00 até 17:00.
- Não agenda em dias passados, finais de semana, feriados nacionais ou horários passados/ocupados.
- Validação de feriados no backend via `https://date.nager.at/api/v3/PublicHolidays/{ano}/BR`, cobrindo o endpoint **2026/BR** indicado no PDF. Cache em memória por 12h. Falha na API externa devolve 503; a reserva não é liberada sem validação.
- Interpreta a data/hora de agendamento no fuso `America/Sao_Paulo`; armazena dia e início do slot separadamente no PostgreSQL.
- Restrição `@@unique([doctorId, date, startTime])` impede que o mesmo médico seja reservado no mesmo dia e horário, inclusive entre unidades diferentes.
- Apenas feriados **nacionais** (`global=true`) são bloqueados; para feriados estaduais/municipais, seria necessário informar a localidade da clínica e ampliar a regra.
- Cada usuário vê apenas os agendamentos da própria conta. Papel `ADMIN` reservado para extensão futura; registro público não permite cadastrar administradores.

## Executar testes e compilar

```powershell
npm test
npm run build
npm run db:studio
```

`npm test` executa cinco testes de regras de negócio. A validação local também incluiu uma bateria auxiliar de 33 verificações de segurança da API, executada separadamente e não versionada neste repositório; ela não substitui uma suíte contínua de testes de integração ou de ponta a ponta.

## Segurança e publicação

- Senhas salvas como hash bcrypt (custo 12), não em texto puro.
- Sessões persistidas no banco; cookie aleatório HttpOnly, `SameSite=Lax`, com `Secure` em produção, expira em sete dias; no banco apenas o **hash** do token.
- Validação de entrada, Helmet, CORS restrito ao frontend, limite de requisições na autenticação e verificação obrigatória do cabeçalho `Origin` em `POST`, `PUT`, `PATCH` e `DELETE` (rejeita origem ausente ou divergente de `FRONTEND_ORIGIN` com `403`).
- Na validação local de 14/10/2026, `npm audit` no backend não reportou vulnerabilidades, com a correção transitiva de `deepmerge-ts`. As verificações não garantem ausência de falhas.
- Para publicar em ambiente real, configure HTTPS, origem do frontend, segredos e credenciais próprias, proxy e cookies adequados ao domínio. O projeto é demonstrativo e foi configurado inicialmente para **localhost**. Observabilidade, política de privacidade, limpeza periódica de sessões, testes de integração e controles CSRF adicionais continuam necessários em uma implantação de produção.

## Estado da aplicação

O frontend React já está implementado, com cadastro, login, painel, catálogo, calendário, agendamento e cancelamento de consultas futuras. O painel administrativo não faz parte desta versão demonstrativa. Veja o [README principal](../README.md) para instalar e executar o projeto completo.
