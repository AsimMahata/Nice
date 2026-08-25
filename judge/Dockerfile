FROM node:20-bullseye

# Environment variables
ENV DEBIAN_FRONTEND=noninteractive
ENV JAVA_HOME=/usr/lib/jvm/java-17-openjdk-amd64
ENV PATH="${JAVA_HOME}/bin:${PATH}"

# Install compilers, runtimes, and sandboxing tools
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    gcc \
    g++ \
    openjdk-17-jdk-headless \
    python3 \
    python3-pip \
    bubblewrap \
    && rm -rf /var/lib/apt/lists/*

# Create unprivileged sandbox user
RUN groupadd -g 1001 judge_sandbox && \
    useradd -u 1001 -g judge_sandbox -m -s /bin/bash judge_sandbox

# Setup sandbox workspace
RUN mkdir -p /tmp/sandbox && \
    chown -R judge_sandbox:judge_sandbox /tmp/sandbox && \
    chmod 777 /tmp/sandbox

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

EXPOSE 5001

CMD ["npm", "run", "dev"]
