# Configurar Supabase para TournamentX

1. Crea un proyecto en Supabase.
2. Abre **SQL Editor**, pega `migrations/202608200001_initial_schema.sql` y pulsa **Run**.
3. En **Authentication > Providers > Google**, habilita Google y agrega el Client ID y Client Secret creados en Google Cloud.
4. En Google Cloud agrega como URI de redirección autorizada la URL indicada por Supabase, con esta forma:
   `https://TU_PROYECTO.supabase.co/auth/v1/callback`.
5. En **Authentication > URL Configuration** configura:
   - Site URL: la URL pública de Vercel.
   - Redirect URLs: `http://localhost:3000/**` y `https://TU-DOMINIO.vercel.app/**`.
6. Copia Project URL y Publishable key al `.env` local y a las variables de entorno de Vercel.

Nunca uses `service_role` ni Secret key dentro de una variable que comience con `VITE_`.
