// 全角/半角、カタカナ/ひらがな程度の表記ゆれを軽く吸収する正規化。
// 完全な同義語辞書（例: 豚肉 = 豚こま切れ肉）は初期スコープ外。
function katakanaToHiragana(str) {
  return str.replace(/[ァ-ヶ]/g, (ch) =>
    String.fromCharCode(ch.charCodeAt(0) - 0x60)
  );
}

function normalize(input) {
  if (typeof input !== "string") return "";
  return katakanaToHiragana(
    input
      .normalize("NFKC") // 全角英数記号→半角、半角カタカナ→全角カタカナ
      .trim()
      .toLowerCase()
  );
}

module.exports = { normalize };
