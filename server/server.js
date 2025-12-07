/**
 * SVGMapTools API
 */
const express = require("express");
const cors = require("cors");
const multer = require("multer");
const { execFile } = require("child_process");
const path = require("path");
const fs = require("fs");
const tmp = require("tmp");
const os = require("os");

// 定数
const JAR_PATH = `/app/svgMapTools.jar`;
const SYMBOL_TEMPLATE_PATH = `/app/symbolTemplate.txt`;
const MAX_UPLOAD_SIZE_MB = 1; // アップロードサイズの上限設定 (1MB)

// Multer の設定
const upload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, os.tmpdir());
    },
    filename: (req, file, cb) => {
      const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
      cb(null, uniqueSuffix + ".csv");
    },
  }),
  limits: { fileSize: MAX_UPLOAD_SIZE_MB * 1024 * 1024 },
});

// サーバの初期化
const app = express();

// CORS の設定
app.use(cors());

// POST - /shape2svgmap
app.post("/shape2svgmap", upload.single("csv"), (req, res) => {
  if (!req.file) {
    res.status(400).send("Error: csv file is required");
    return;
  }
  const inputCsvPath = req.file.path;

  // SVG ファイルの生成先として一時ディレクトリを設定
  const outputSvgDir = tmp.dirSync({
    unsafeCleanup: true,
  });
  const outputSvgPath = path.join(outputSvgDir.name, `output.svg`);

  // SVGMapTools コマンド実行用の引数を設定
  const args = [
    "-Xmx2g",
    "-jar",
    JAR_PATH,
    "Shape2SVGMap",
    "-poisymbol",
    SYMBOL_TEMPLATE_PATH,
    "-micrometa2",
    "-level",
    "3",
    "-limit",
    "50",
    "-showtile",
    "-densityControl",
    "400",
    "-lowresimage",
    "-charset",
    "utf-8",
    "-linktitle",
    "3",
    inputCsvPath,
    outputSvgPath,
  ];
  console.log("Executing command:", "java", args.join(" "));

  // SVGMapTools コマンドを実行
  execFile("java", args, (error, stdout, stderr) => {
    if (error) {
      res.status(500).send(stderr || error.message);
      fs.unlink(inputCsvPath, () => {});
      outputSvgDir.removeCallback();
      return;
    }

    // ログ出力
    if (stdout) {
      console.log(stdout);
    }

    // 生成された SVG ファイルを読み込む
    fs.readFile(outputSvgPath, (err, data) => {
      if (err) {
        res.status(500).send("Error: generation failed");
        fs.unlink(inputCsvPath, () => {});
        outputSvgDir.removeCallback();
        return;
      }

      // MIME タイプを設定して SVG データを送信
      res.type("image/svg+xml").send(data);

      // アップロードされた CSV ファイルの削除
      fs.unlink(inputCsvPath, () => {});

      // SVG ファイルの生成先ディレクトリを削除
      outputSvgDir.removeCallback();
    });
  });
});

// ファイルサイズ制限エラーハンドラ
app.use((err, req, res, next) => {
  if (err.code === "LIMIT_FILE_SIZE") {
    res.status(413).send("Error: File size exceeds the maximum limit");
  } else {
    next(err);
  }
});

// サーバを起動
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server started on port ${PORT}`);
});
