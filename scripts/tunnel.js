require("dotenv").config();
const ngrok = require("@ngrok/ngrok");

async function main() {
  const authtoken = process.env.NGROK_AUTHTOKEN;
  if (!authtoken) {
    console.error(
      "NGROK_AUTHTOKEN が .env に設定されていません。\n" +
        "https://dashboard.ngrok.com/get-started/your-authtoken で取得して .env に設定してください。"
    );
    process.exit(1);
  }

  const port = Number(process.env.PORT) || 3000;
  const listener = await ngrok.forward({ addr: port, authtoken });

  console.log(`公開URL: ${listener.url()}`);
  console.log("このURLに APP_USERNAME / APP_PASSWORD でログインしてアクセスできます。");
  console.log("終了するには Ctrl+C を押してください。");
}

main().catch((err) => {
  console.error("トンネルの起動に失敗しました:", err);
  process.exit(1);
});
