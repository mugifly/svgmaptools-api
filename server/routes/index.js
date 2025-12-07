/**
 * ルーティング設定
 */

const router = require("express").Router();
const os = require("os");
const multer = require("multer");

// ファイルアップロードの受付設定
const MAX_UPLOAD_SIZE_MB = 1; // アップロードサイズの上限 (1MB)
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

// POST - /shape2svgmap
router.post("/shape2svgmap", upload.single("csv"), require("./shape2svgmap"));

module.exports = router;
