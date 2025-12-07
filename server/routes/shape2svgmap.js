/**
 * POST - /shape2svgmap
 */

const tmp = require("tmp");
const path = require("path");
const fs = require("fs");
const fsp = require("fs").promises;
const { validateCsvFile } = require("../helper");
const util = require("util");
const execFile = util.promisify(require("child_process").execFile);

// 定数
const JAR_PATH = `/app/svgMapTools.jar`;
const SYMBOL_TEMPLATE_PATH = `/app/symbolTemplate.txt`;

// エクスポートされる関数
module.exports = async (req, res) => {
  if (!req.file) {
    res.status(400).send("Error: csv file is required");
    return;
  }
  const inputCsvPath = req.file.path;

  // CSV妥当性チェック
  try {
    const isValid = await validateCsvFile(inputCsvPath);
    if (!isValid) {
      // CSVファイルが無効な場合は削除してエラーを返す
      await fsp.unlink(inputCsvPath).catch(() => {});
      return res.status(400).send("Error: Invalid CSV format");
    }
  } catch (e) {
    // CSVファイルが無効な場合は削除してエラーを返す
    await fsp.unlink(inputCsvPath).catch(() => {});
    return res.status(400).send("Error: " + e.message);
  }

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

  try {
    // SVGMapTools コマンドを実行
    console.log("Executing command:", "java", args.join(" "));
    const { stdout, stderr } = await execFile("java", args);

    // ログ出力
    if (stdout) {
      console.log(stdout);
    }

    // 生成された SVG ファイルをレスポンスとして返す
    const data = await fsp.readFile(outputSvgPath);
    res.type("image/svg+xml").send(data);
  } catch (error) {
    // エラー処理
    res
      .status(500)
      .send(error.stderr || error.message || "Error: generation failed");
  } finally {
    // アップロードされた CSV ファイルを削除
    await fsp.unlink(inputCsvPath).catch(() => {});
    // SVG ファイルの生成先ディレクトリを削除
    outputSvgDir.removeCallback();
  }
};
