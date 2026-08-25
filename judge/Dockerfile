FROM node:20-bullseye

# Install compilers and runtimes for C, C++, Java, and Python
RUN apt-get update && apt-get install -y \
  build-essential \
  g++ \
  gcc \
  openjdk-17-jdk-headless \
  python3 \
  python3-pip \
  && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Set environment variables for Java
ENV JAVA_HOME=/usr/lib/jvm/java-17-openjdk-amd64
ENV PATH=$JAVA_HOME/bin:$PATH

COPY package*.json ./
RUN npm install

COPY . .

EXPOSE 5001

CMD ["npm", "run", "dev"]
