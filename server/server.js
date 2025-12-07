/**
 * SVGMapTools API
 */

const express = require("express");
const cors = require("cors");

// サーバの初期化
const app = express();

// CORS の設定
app.use(cors());

// ファイルサイズ制限超過時に対するハンドラの設定
app.use((err, req, res, next) => {
  if (err.code === "LIMIT_FILE_SIZE") {
    // レスポンスとしてエラーメッセージを返す
    res.status(413).send("Error: File size exceeds the maximum limit");
  } else {
    next(err);
  }
});

// ルータの設定
app.use("/", require("./routes/index"));

// サーバを起動
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server started on port ${PORT}`);
});
