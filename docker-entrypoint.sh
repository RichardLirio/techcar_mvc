#!/bin/sh
set -e

# Função para aguardar o PostgreSQL estar pronto
wait_for_postgres() {
  echo "Aguardando PostgreSQL estar disponível..."
  
  until pg_isready -h postgres -p 5432 -U "${PG_USER}" -d "${PG_DB}"; do
    echo "PostgreSQL não está pronto ainda - aguardando..."
    sleep 2
  done
  
  echo "PostgreSQL está pronto!"
}

# Aguarda o PostgreSQL apenas se estivermos conectando a ele
if [ -n "${DATABASE_URL}" ] && echo "${DATABASE_URL}" | grep -q "postgres"; then
  wait_for_postgres
fi

# Executa migrações do Prisma apenas em produção
if [ "${NODE_ENV}" = "production" ]; then
  echo "Executando migrações do Prisma..."
  npx prisma migrate deploy
  
  echo "Executando seed do banco (se existir)..."
  npx prisma db seed 2>/dev/null || echo "Seed não encontrado ou falhou - continuando..."
fi

# Executa o comando passado como argumento
exec "$@"