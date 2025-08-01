FROM node:22.17.0-alpine AS base

# Instala dependências do sistema necessárias
RUN apk add --no-cache dumb-init postgresql-client

# Cria um usuário não-root para segurança
RUN addgroup -g 1001 -S nodejs
RUN adduser -S expressapp -u 1001

# Define o diretório de trabalho
WORKDIR /app

# Copia os arquivos de dependências
COPY package*.json ./
COPY tsconfig.json ./

# Copia o script de entrypoint
COPY docker-entrypoint.sh /usr/local/bin/
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

# Stage para desenvolvimento
FROM base AS development
ENV NODE_ENV=development
ENV HUSKY=0
RUN npm ci --include=dev
COPY . .
# Gerar cliente Prisma
RUN npx prisma generate

RUN chown -R expressapp:nodejs /app
USER expressapp
EXPOSE 3333
ENTRYPOINT ["docker-entrypoint.sh"]
CMD ["dumb-init", "npm", "run", "dev"]

# Stage para build - aqui instalamos TODAS as dependências e geramos o Prisma
FROM base AS builder
ENV NODE_ENV=development
ENV HUSKY=0

# Instalar TODAS as dependências (incluindo dev para ter o Prisma CLI)
RUN npm ci --include=dev

# Copiar código fonte e schema do Prisma
COPY . .

# Gerar cliente Prisma
RUN npx prisma generate

# Build da aplicação TypeScript
RUN npm run build

# Stage para produção - apenas dependências de runtime
FROM base AS production-deps
ENV NODE_ENV=production
ENV HUSKY=0

# Copiar arquivos de dependências
COPY package*.json ./

# Instalar apenas dependências de produção
RUN npm ci --omit=dev --ignore-scripts && npm cache clean --force

# Stage final para produção
FROM base AS production
ENV NODE_ENV=production

# Copiar dependências de produção do stage anterior
COPY --from=production-deps --chown=expressapp:nodejs /app/node_modules ./node_modules

# Copiar código compilado do builder
COPY --from=builder --chown=expressapp:nodejs /app/dist ./dist

# Copiar cliente Prisma gerado do builder
COPY --from=builder --chown=expressapp:nodejs /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder --chown=expressapp:nodejs /app/node_modules/@prisma/client ./node_modules/@prisma/client

# Copiar schema do Prisma e arquivos de migração para produção
COPY --from=builder --chown=expressapp:nodejs /app/prisma ./prisma

# Copiar package.json para ter as informações necessárias
COPY --from=builder --chown=expressapp:nodejs /app/package*.json ./

# Muda para usuário não-root
USER expressapp

# Expõe a porta da aplicação
EXPOSE 3333

# Comando para executar a aplicação
ENTRYPOINT ["docker-entrypoint.sh"]
CMD ["dumb-init", "node", "dist/server.js"]