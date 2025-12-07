# --- Build Stage ---
FROM maven:3.9-eclipse-temurin-17 AS build
WORKDIR /app

# ソースコードのダウンロードと展開
RUN apt-get update && apt-get install -y unzip && \
    wget https://github.com/svgmap/svgMapTools/archive/refs/heads/master.zip && \
    unzip master.zip && \
    mv svgMapTools-master/* . && \
    rm -rf svgMapTools-master master.zip

# 依存ライブラリのダウンロード
RUN mvn dependency:go-offline

# パッケージング（テストはスキップして依存関係込みのJarを生成）
RUN mvn package -DskipTests

RUN ls -laR

# --- Runtime Stage ---
FROM eclipse-temurin:17-jre
WORKDIR /app

# ビルドステージから Jar をコピー
COPY --from=build /app/target/svgMapTools-*-jar-with-dependencies.jar /app/svgMapTools.jar

# データの入出力用ディレクトリを作成
RUN mkdir /data
WORKDIR /data

# コンテナ起動時のデフォルトコマンド
# メモリ設定(-Xmx)は必要に応じて調整してください
ENTRYPOINT ["java", "-Xmx800m", "-jar", "/app/svgMapTools.jar"]
CMD ["--help"]