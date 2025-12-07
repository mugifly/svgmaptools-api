# --- Build Stage ---
FROM maven:3.9-eclipse-temurin-17 AS build

# ソースコードのダウンロードと展開
WORKDIR /build
ARG SVG_MAP_TOOLS_REPO_REF=refs/heads/master
RUN apt-get update && apt-get install -y unzip && \
    wget https://github.com/svgmap/svgMapTools/archive/${SVG_MAP_TOOLS_REPO_REF}.zip -O svgmaptools.zip && \
    unzip svgmaptools.zip && rm svgmaptools.zip && \
    mv svgMapTools-* svgMapTools && \
    ls -laR
WORKDIR /build/svgMapTools

# 依存ライブラリのダウンロード
RUN mvn dependency:go-offline

# パッケージング（テストはスキップして依存関係込みのJarを生成）
RUN mvn package -DskipTests

# --- Runtime Stage ---
FROM eclipse-temurin:17-jre
WORKDIR /app

# Node.js をインストール
RUN apt-get update && apt-get install -y curl && \
    curl -fsSL https://deb.nodesource.com/setup_24.x | bash - && \
    apt-get install -y nodejs && \
    node -v && npm -v && \
    apt-get clean

# ビルドステージから Jar をコピー
COPY --from=build /build/svgMapTools/target/svgMapTools-*-jar-with-dependencies.jar /app/svgMapTools.jar

# ビルドステージから symbolTemplate.txt をコピー
COPY --from=build /build/svgMapTools/tools/symbolTemplate.txt /app/symbolTemplate.txt

# Node.js アプリケーションの依存関係をインストール
COPY server/package.json /app/server/package.json
COPY server/package-lock.json /app/server/package-lock.json
WORKDIR /app/server
RUN npm install 

# Node.js アプリケーションのソースコードをコピー
COPY server/ /app/server/

# コンテナ起動時のデフォルトコマンド
EXPOSE 8080
ENTRYPOINT ["node", "/app/server/server.js"]