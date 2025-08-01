#!/bin/sh

# Docker entrypoint script para Express Boilerplate com Prisma
# Este script executa comandos do Prisma antes de iniciar a aplicação

set -e

echo "🚀 Iniciando Express Boilerplate com Prisma..."

# Função para aguardar o banco de dados ficar disponível
wait_for_db() {
    echo "⏳ Aguardando banco de dados ficar disponível..."
    
    # Extrai informações da DATABASE_URL
    DB_HOST=$(echo $DATABASE_URL | sed 's/.*@\([^:]*\):.*/\1/')
    DB_PORT=$(echo $DATABASE_URL | sed 's/.*:\([0-9]*\)\/.*/\1/')
    DB_USER=$(echo $DATABASE_URL | sed 's/.*\/\/\([^:]*\):.*/\1/')
    DB_NAME=$(echo $DATABASE_URL | sed 's/.*\/\([^?]*\).*/\1/')
    
    # Aguarda até o banco estar disponível
    until pg_isready -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME; do
        echo "🔄 Banco de dados não disponível ainda, aguardando 3 segundos..."
        sleep 3
    done
    
    echo "✅ Banco de dados disponível!"
}

# Função para executar comandos do Prisma
run_prisma_commands() {
    echo "🔧 Executando comandos do Prisma..."
    
    # Verificar se o cliente Prisma foi gerado
    if [ ! -d "node_modules/.prisma" ]; then
        echo "❌ Cliente Prisma não encontrado! O build pode ter falhado."
        exit 1
    fi
    
    # 1. Executar migrações (deploy)
    echo "🗄️ Executando migrações do banco de dados..."
    # Usar o cliente Prisma diretamente, já que foi gerado no build
    node -e "
        const { PrismaClient } = require('@prisma/client');
        const { execSync } = require('child_process');
        
        async function runMigrations() {
            try {
                console.log('Executando prisma migrate deploy...');
                execSync('npx prisma migrate deploy', { 
                    stdio: 'inherit',
                    env: { ...process.env }
                });
                console.log('✅ Migrações executadas com sucesso!');
            } catch (error) {
                console.error('❌ Erro ao executar migrações:', error.message);
                process.exit(1);
            }
        }
        
        runMigrations();
    "
    
    # 2. Executar seed (se existir e se DATABASE_SEED for true)
    if [ "$DATABASE_SEED" = "true" ] && ([ -f "prisma/seed.ts" ] || [ -f "prisma/seed.js" ]); then
        echo "🌱 Executando seed do banco de dados..."
        node -e "
            const { execSync } = require('child_process');
            
            try {
                console.log('Executando prisma db seed...');
                execSync('npx prisma db seed', { 
                    stdio: 'inherit',
                    env: { ...process.env }
                });
                console.log('✅ Seed executado com sucesso!');
            } catch (error) {
                console.warn('⚠️  Aviso: Erro ao executar seed (pode ser normal):', error.message);
            }
        "
    else
        echo "ℹ️ Seed desabilitado ou arquivo não encontrado (DATABASE_SEED=${DATABASE_SEED})"
    fi
    
    echo "✅ Comandos do Prisma executados com sucesso!"
}

# Função para verificar se é ambiente de produção
is_production() {
    [ "$NODE_ENV" = "production" ]
}

# Função principal
main() {
    # Aguarda o banco de dados apenas se DATABASE_URL estiver definida
    if [ -n "$DATABASE_URL" ]; then
        wait_for_db
        
        # Executa comandos do Prisma apenas em produção ou se explicitamente solicitado
        if is_production || [ "$RUN_PRISMA_COMMANDS" = "true" ]; then
            run_prisma_commands
        else
            echo "ℹ️ Ambiente de desenvolvimento detectado, pulando comandos automáticos do Prisma"
        fi
    else
        echo "⚠️ DATABASE_URL não definida, pulando verificações do banco de dados"
    fi
    
    echo "🎉 Iniciando aplicação..."
    
    # Executa o comando passado como argumento
    exec "$@"
}

# Executa a função principal com todos os argumentos
main "$@"