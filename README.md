# RCX Locações e Serviços LTDA · Gestão de Frota (PWA)

Sistema web privado e instalável para gestão completa da frota, com:

- Next.js (App Router) + Tailwind CSS
- Supabase Auth + RLS (Row Level Security)
- Registro de ações (`Criado por`, `Atualizado por`, `Deletado por`) em trilha de auditoria
- Dashboard com alertas operacionais
- Módulos de veículos, documentação, manutenção, peças, pneus e observações

## 1) Configuração

```bash
cp .env.example .env.local
# preencher variáveis do Supabase
npm install
npm run dev
```

## 2) Banco Supabase

Execute `supabase/schema.sql` no SQL Editor do projeto Supabase.

Esse script cria:
- tabelas do domínio da frota
- tabela de perfis e papéis (`admin`, `funcionario`)
- função de auditoria automática em todos os CRUDs principais
- políticas RLS de segurança por usuário autenticado

## 3) PWA instalável

- Manifesto em `public/manifest.json`
- Service worker via `next-pwa`
- Botão **Instalar app** disponível na tela de login

## 4) Segurança

- Acesso apenas com usuário autenticado
- RLS habilitado em todas as tabelas sensíveis
- Auditoria central com usuário e ação executada

