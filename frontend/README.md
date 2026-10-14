# Vida Clínica — Frontend

Interface web para o teste técnico Full Stack, integrada à API já construída na pasta `backend/`.

## Tecnologias

React 19, TypeScript, Vite 6, Tailwind CSS 3, React Router e Lucide.

## Iniciar no Windows (PowerShell)

Com o backend rodando em `http://localhost:3333` e o PostgreSQL iniciado:

```powershell
cd frontend
Copy-Item .env.example .env
npm install
npm run dev
```

Abra **http://localhost:5173**. O frontend usa a variável `VITE_API_URL` para chamar o backend (padrão `http://localhost:3333`). Vite está configurado para **porta 5173 fixa**: a mesma origem permitida pelo backend via `FRONTEND_ORIGIN`.

## Funcionalidades

- `/cadastro`: criação de conta de paciente (nome, e-mail, senha e confirmação);
- `/login`: login e sessão por cookie HttpOnly (`credentials: 'include'`);
- `/dashboard`: resumo das consultas do usuário;
- `/agendar`: calendário, consulta de horários livres e confirmação, com mensagens para feriados e horários ocupados;
- `/minhas-consultas`: listagem das próprias reservas;
- botão de sair da conta e proteção das páginas privadas.

O frontend **não** armazena senha ou cookie de sessão em `localStorage`. O backend continua sendo a fonte de verdade para feriados, horários, autenticação e conflitos.

## Comandos úteis

```powershell
npm run build       # verifica TypeScript e compila
npm run typecheck   # somente validação de tipos
npm run preview     # serve o build local
```

## Dicas de teste

1. Entre com o paciente que você já cadastrou no backend, `paciente.teste@example.com` e a senha utilizada no PowerShell.
2. Abra **Agendar consulta**. Selecione `03/11/2026`: o slot das 09:00 não deve aparecer, pois já está reservado.
3. Selecione um dia útil com horários livres e confirme uma reserva.
4. Consulte o registro em **Minhas consultas** e no Prisma Studio.
5. Teste logout, bloqueio de rotas e uma segunda tentativa de agendar o mesmo horário por outra conta.

## Erros comuns

- **Erro de rede:** confira `npm run dev` do backend na porta 3333 e `docker compose ps`.
- **CORS:** o backend deve usar `FRONTEND_ORIGIN=http://localhost:5173` e o frontend deve abrir pelo endereço `http://localhost:5173` (não `127.0.0.1`). Reinicie o backend se alterar `.env`.
- **409 Conflict:** horário foi reservado; escolha outro. Os horários são carregados novamente.
- **503:** API externa de feriados indisponível; backend não permite reservas sem validação.
- **npm ENOENT:** verifique se está dentro da pasta `frontend` antes de executar `npm install`.

## Limites atuais

O teste não exige integração com WhatsApp nem painel administrativo. Ambos ficam fora do escopo inicial. A versão atual não oferece cancelamento ou alteração de consultas, pois o backend não possui essas rotas.

## Atualização de responsividade e cancelamento

Login e cadastro cabem na altura visível de notebooks/desktops de altura normal, sem rolagem. Em celulares, zoom alto e alturas extremas, a rolagem é permitida para preservar a acessibilidade.

Em **Minhas consultas**, o paciente pode clicar em **Cancelar** numa consulta futura e confirmar em modal. A chamada `DELETE /appointments/:id` requer também o backend atualizado; não é preciso migration adicional.
