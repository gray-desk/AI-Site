/**
 * @fileoverview 画像処理ユーティリティ
 * Sharpライブラリを使用して、画像の最適化（リサイズ、圧縮、WebP変換）を行います。
 */

const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

/**
 * 画像を最適化して保存します。
 * - 指定された幅にリサイズ（アスペクト比維持）
 * - WebP形式に変換
 * - 品質設定による圧縮
 * 
 * @param {string} inputPath - 入力画像のパス
 * @param {string} outputPath - 出力画像のパス（拡張子は自動的に.webpになります）
 * @param {object} options - オプション
 * @param {number} [options.width=1200] - リサイズする幅
 * @param {number} [options.quality=80] - 画質 (1-100)
 * @returns {Promise<object>} 処理結果の情報
 */
const optimizeImage = async (inputPath, outputPath, options = {}) => {
    const { width = 1200, quality = 80 } = options;

    try {
        // 出力ディレクトリの作成
        const dir = path.dirname(outputPath);
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }

        // 拡張子を.webpに変更
        const finalOutputPath = outputPath.replace(/\.[^.]+$/, '.webp');

        const info = await sharp(inputPath)
            .resize(width, null, {
                withoutEnlargement: true, // 元画像より大きくしない
                fit: 'inside',
            })
            .webp({ quality })
            .toFile(finalOutputPath);

        console.log(`[imageProcessor] Optimized: ${path.basename(inputPath)} -> ${path.basename(finalOutputPath)}`);
        return {
            path: finalOutputPath,
            ...info
        };
    } catch (error) {
        console.error(`[imageProcessor] Failed to optimize ${inputPath}:`, error.message);
        throw error;
    }
};

module.exports = {
    optimizeImage,
};
