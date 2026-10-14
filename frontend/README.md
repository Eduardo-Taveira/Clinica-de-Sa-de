# Vida Clínica — Frontend

Interface web para o teste técnico Full Stack, integrada à API já construída na pasta `backend/`.

## Tecnologias

React 19, TypeScript, Vite 6, Tailwind CSS 3, React Router 7 e Lucide.

## Iniciar no Windows (PowerShell)

Com o backend rodando em `http://localhost:3333` e o PostgreSQL iniciado:

```powershell
cd frontend
Copy-Item .env.example .env
npm ci
npm run dev
```

Abra **http://localhost:5173**. O frontend usa a variável `VITE_API_URL` para chamar o backend (padrão `http://localhost:3333`). Vite está configurado para **porta 5173 fixa**: a mesma origem permitida pelo backend via `FRONTEND_ORIGIN`.

## Funcionalidades

- `/cadastro`: criação de conta de paciente (nome, e-mail, senha e confirmação);
- `/login`: login e sessão por cookie HttpOnly (`credentials: 'include'`);
- `/dashboard`: resumo das consultas do usuário;
- `/agendar`: calendário, consulta de horários livres e confirmação, com mensagens para feriados e horários ocupados;
- `/minhas-consultas`: listagem das próprias reservas e cancelamento de consultas futuras;
- botão de sair da conta e proteção das páginas privadas.

O frontend **não** armazena senha ou cookie de sessão em `localStorage`. O backend continua sendo a fonte de verdade para feriados, horários, autenticação e conflitos.

## Comandos úteis

```powershell
npm run build       # verifica TypeScript e compila
npm run typecheck   # somente validação de tipos
npm run preview     # serve o build local
```

## Dicas de teste

1. Com o backend, o PostgreSQL e o seed ativos, abra `http://localhost:5173/cadastro` e crie uma conta fictícia. O seed **não** cadastra pacientes.
2. Faça login, confira o dashboard e abra **Agendar consulta**.
3. Escolha especialidade, médico, unidade, um dia útil futuro e um horário disponível; confirme a reserva.
4. Confira a reserva em **Minhas consultas** e teste **Cancelar** em uma consulta futura.
5. Confira bloqueios de final de semana, feriado e horário já ocupado. Para avaliar isolamento entre pacientes, use duas contas distintas.

O frontend e o backend esperam a origem exata `http://localhost:5173`; mutações feitas por clientes manuais também precisam enviar esse valor no cabeçalho `Origin`.

## Erros comuns

- **Erro de rede:** confira `npm run dev` do backend na porta 3333 e `docker compose ps`.
- **CORS:** o backend deve usar `FRONTEND_ORIGIN=http://localhost:5173` e o frontend deve abrir pelo endereço `http://localhost:5173` (não `127.0.0.1`). Reinicie o backend se alterar `.env`.
- **409 Conflict:** horário foi reservado; escolha outro. Os horários são carregados novamente.
- **503:** API externa de feriados indisponível; backend não permite reservas sem validação.
- **npm ENOENT:** verifique se está dentro da pasta `frontend` antes de executar `npm install`.

## Limites atuais

O projeto demonstrativo não possui painel administrativo, integrações de mensagens nem remarcação de consultas. **O cancelamento de consultas futuras está implementado**; a ação exclui a reserva e libera o horário.

## Responsividade e cancelamento

Login e cadastro cabem na altura visível de notebooks/desktops de altura normal, sem rolagem. Em celulares, zoom alto e alturas extremas, a rolagem é permitida para preservar a acessibilidade.

Em **Minhas consultas**, o paciente pode clicar em **Cancelar** numa consulta futura e confirmar em modal. A chamada `DELETE /appointments/:id` é protegida por autenticação e autorização no backend. O navegador envia automaticamente a origem autorizada.


## Segurança e dependências

A sessão usa cookie `HttpOnly` controlado pelo backend; a aplicação não armazena senhas ou tokens em `localStorage`. Após a atualização para React Router 7, `npm run typecheck` e `npm run build` foram executados com sucesso. Na auditoria local de 14/10/2026, `npm audit --omit=dev` retornou **0 vulnerabilidades reportadas**; `npm audit` completo ainda apontou **7 avisos (5 altos e 2 moderados)** em ferramentas de desenvolvimento ligadas ao Tailwind CSS 3. Esses alertas precisam de acompanhamento e não devem ser ignorados em uma implantação de produção.
