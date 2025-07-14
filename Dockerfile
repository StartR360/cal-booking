# syntax = docker/dockerfile:1

# Adjust NODE_VERSION as desired
ARG NODE_VERSION=20.7.0
FROM node:${NODE_VERSION}-slim as base

# Next.js/Prisma app lives here
WORKDIR /app

# Set production environment
ENV NODE_ENV="production"

# Throw-away build stage to reduce size of final image
FROM base as build

# Install system dependencies
RUN apt-get update -qq && \
    apt-get install -y build-essential openssl pkg-config python-is-python3 && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists /var/cache/apt/archives

# Install corepack and enable yarn
RUN npm install -g corepack@0.24.1 && corepack enable

# Copy package files
COPY package.json yarn.lock .yarnrc.yml ./
COPY .yarn ./.yarn

# Copy all source code
COPY . .

# Install dependencies with frozen lockfile for reliability
RUN yarn install --frozen-lockfile

# Build the web app
RUN yarn workspace @calcom/web build

# Final stage
FROM base
WORKDIR /app

# Install packages needed for deployment
RUN apt-get update -qq && \
    apt-get install --no-install-recommends -y openssl && \
    rm -rf /var/lib/apt/lists /var/cache/apt/archives

# Copy built application
COPY --from=build /app/package.json ./package.json
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/apps/web/package.json ./apps/web/package.json
COPY --from=build /app/apps/web/.next ./apps/web/.next
COPY --from=build /app/apps/web/public ./apps/web/public
COPY --from=build /app/apps/web/next.config.js ./apps/web/next.config.js
COPY --from=build /app/apps/web/next-i18next.config.js ./apps/web/next-i18next.config.js
COPY --from=build /app/packages ./packages
COPY --from=build /app/turbo.json ./turbo.json
COPY --from=build /app/yarn.lock ./yarn.lock

# Expose port 3000
EXPOSE 3000

# Start the web app
CMD [ "yarn", "workspace", "@calcom/web", "start" ] 