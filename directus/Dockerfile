FROM node:18-alpine

WORKDIR /directus

# Instalovat npm přímo bez root package.json
RUN npm install -g directus

EXPOSE 8055

CMD ["directus", "start"]
