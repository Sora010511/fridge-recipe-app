const crypto = require("crypto");

function safeEqual(a, b) {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) {
    // 長さが違うと timingSafeEqual が例外を投げるため、ダミー比較で長さ由来のタイミング差を減らす
    crypto.timingSafeEqual(bufA, bufA);
    return false;
  }
  return crypto.timingSafeEqual(bufA, bufB);
}

// 外部公開（ngrok等）を見据えた最小限のBasic認証。
// 資格情報が未設定のまま公開してしまう事故を防ぐため、未設定時は全リクエストを拒否する。
function basicAuth(req, res, next) {
  const username = process.env.APP_USERNAME;
  const password = process.env.APP_PASSWORD;

  if (!username || !password) {
    return res.status(503).json({
      error: "AUTH_NOT_CONFIGURED",
      message: "APP_USERNAME / APP_PASSWORD が .env に設定されていません。",
    });
  }

  const header = req.headers.authorization || "";
  const [scheme, encoded] = header.split(" ");

  if (scheme === "Basic" && encoded) {
    const decoded = Buffer.from(encoded, "base64").toString("utf8");
    const sepIndex = decoded.indexOf(":");
    const providedUser = sepIndex === -1 ? decoded : decoded.slice(0, sepIndex);
    const providedPass = sepIndex === -1 ? "" : decoded.slice(sepIndex + 1);

    if (safeEqual(providedUser, username) && safeEqual(providedPass, password)) {
      return next();
    }
  }

  res.set("WWW-Authenticate", 'Basic realm="fridge-recipe-app"');
  res.status(401).send("認証が必要です");
}

module.exports = basicAuth;
