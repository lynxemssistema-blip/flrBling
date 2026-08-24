# Base image com Node.js LTS leve
FROM node:20-alpine

# Diretório de trabalho
WORKDIR /app

# Copia dependências primeiro para cache do Docker
COPY package*.json ./

# Instala dependências de produção
RUN npm ci --only=production

# Copia todo o código da aplicação
COPY . .

# Expõe a porta 3000
EXPOSE 3000

# Variável de ambiente padrão
ENV NODE_ENV=production
ENV PORT=3000

# Comando para iniciar o servidor
CMD ["node", "server.js"]
