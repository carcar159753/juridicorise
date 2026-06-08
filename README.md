# Rise Jurídico - Supabase + Render + GitHub

Sistema jurídico da Rise preparado para hospedagem 24h.

## Logins padrão

- ADM Geral: `carcar` / `159753`
- Polícia: `policia` / `159753`

## Render - modo recomendado

Se deixar o Root Directory vazio, use:

- Build Command: `npm install`
- Start Command: `npm start`

Variáveis no Render:

```env
SUPABASE_URL=https://SEU_PROJETO.supabase.co
SUPABASE_SERVICE_ROLE_KEY=SUA_SECRET_KEY
JWT_SECRET=rise_juridico_159753
PORT=10000
NODE_ENV=production
DATABASE_URL=SUA_CONNECTION_STRING_DO_SUPABASE
```

## Banco automático

O backend cria/atualiza automaticamente as tabelas quando iniciar, mas para isso precisa da variável:

```env
DATABASE_URL=postgresql://...
```

Pegue no Supabase em:

Project Settings > Database > Connection string > URI

Use o modo Pooler/Transaction se aparecer.

Se não configurar `DATABASE_URL`, o sistema ainda sobe, mas as tabelas precisam existir no Supabase. Nesse caso rode manualmente o arquivo:

`supabase/schema.sql`

## Supabase keys

No Render use:

- `SUPABASE_URL`: Project URL sem `/rest/v1`
- `SUPABASE_SERVICE_ROLE_KEY`: Secret key `sb_secret_...`

Não coloque a secret key no frontend.

## Permissões

- `adm_geral`: acesso total.
- `policia`: processos, mandados e porte de armas.
- `advogado`: documentos jurídicos, troca de nome, patente, certidões e alvarás.
- `juiz`: aprova e assina documentos.

## Observação

O sistema não usa CPF/RG. Os campos principais são ID, nome, telefone e sexo.
