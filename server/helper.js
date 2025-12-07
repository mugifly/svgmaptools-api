const fs = require("fs");
const { parse } = require("csv-parse");

/**
 * CSVファイルとしての妥当性を検証する関数
 * @param {string} filePath - アップロードされた一時ファイルのパス
 * @returns {Promise<boolean>} - 妥当なら true, 不正なら false (または throw)
 */
async function validateCsvFile(filePath) {
  return new Promise((resolve, reject) => {
    const stream = fs.createReadStream(filePath);
    let isFirstChunk = true;
    const parser = parse({
      delimiter: ",",
      relax_column_count: false,
      trim: true,
      skip_empty_lines: true,
    });
    stream.on("data", (chunk) => {
      if (isFirstChunk) {
        if (chunk.includes("\0")) {
          stream.destroy();
          reject(new Error("Binary file detected. Not a valid CSV."));
        }
        isFirstChunk = false;
      }
    });
    stream
      .pipe(parser)
      .on("data", (row) => {
        // 必要ならヘッダー名チェックなどもここで可能
      })
      .on("error", (err) => {
        resolve(false);
      })
      .on("end", () => {
        resolve(true);
      });
  });
}

module.exports = {
  validateCsvFile,
};
