FROM node:20

RUN apt-get update && apt-get install -y git unzip

RUN npm install -g expo-cli eas-cli

WORKDIR /app

CMD ["bash"]
