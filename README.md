# Sistema Jurídico Rise — Supabase + Render + GitHub

Projeto pronto para deixar 24h online.

## Logins padrão
Depois de rodar o seed:
- ADM Geral: `carcar` / `159753`
- Polícia: `policia` / `159753`

## Estrutura
- `backend/` API Node.js + Express + frontend estático
- `backend/public/` site do sistema
- `supabase/schema.sql` tabelas do banco
- `render.yaml` deploy automático no Render

## 1. Criar banco no Supabase
1. Entre em https://supabase.com/
2. Crie um projeto
3. Abra **SQL Editor**
4. Cole o conteúdo de `supabase/schema.sql`
5. Clique em **Run**

## 2. Pegar chaves
No Supabase:
- Project Settings → API
- Copie `Project URL`
- Copie `service_role key`

## 3. Rodar local
```bash
cd backend
npm install
copy .env.example .env
npm run seed
npm start
```

No arquivo `.env`, coloque:
```env
SUPABASE_URL=https://SEU-PROJETO.supabase.co
SUPABASE_SERVICE_ROLE_KEY=SUA_SERVICE_ROLE_KEY
JWT_SECRET=qualquer-chave-grande
FRONTEND_URL=http://localhost:3000
PORT=3000
```

Abra:
```text
http://localhost:3000
```

## 4. Subir no GitHub
```bash
git init
git add .
git commit -m "Sistema juridico Rise Supabase Render"
git branch -M main
git remote add origin URL_DO_SEU_REPOSITORIO
git push -u origin main
```

## 5. Deploy no Render
1. Entre em https://dashboard.render.com/
2. New → Web Service
3. Conecte o repositório do GitHub
4. Root Directory: `backend`
5. Build Command: `npm install`
6. Start Command: `npm start`
7. Environment Variables:
   - `SUPABASE_URL`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `JWT_SECRET`
   - `FRONTEND_URL` = URL final do Render

Depois do deploy, abra o Shell do Render e rode:
```bash
npm run seed
```

## Permissões
- `adm_geral`: vê tudo, cria usuários, edita, apaga, histórico e backup.
- `policia`: vê apenas Processos, Mandados e Porte de Armas.
- `advogado`: certidões, troca de nome, patentes, alvarás e documentos diversos.
- `juiz`: acesso amplo para aprovar documentos.

## Documentos/PDF
Todos os módulos têm botão PDF. O PDF usa os dados reais cadastrados no Supabase e não usa números fake.

Campos principais mantidos: ID, nome, telefone e sexo. Não tem CPF/RG.
