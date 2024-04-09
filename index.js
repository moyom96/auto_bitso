import fetch from "node-fetch";
import crypto from "crypto";

import "dotenv/config";

const { API_KEY, API_SECRET } = process.env;
const API_URL = `https://bitso.com`;

const ENDPOINTS = {
  balance: "/api/v3/balance/",
  order: "/api/v3/orders/",
};

const BOOKS = {
  btc: "btc_mxn",
  usd: "usd_mxn",
};

const MXN_TO_USD = "500";
const MXN_TO_BTC = "100";

// body has to be stringified
const callRest = async (method, path, body = "") => {
  const nonce = Date.now();
  const data = `${nonce}${method}${path}${body}`;
  const hmac = crypto.createHmac("sha256", API_SECRET);
  hmac.update(data);
  const signature = hmac.digest("hex");

  const response = await fetch(`${API_URL}${path}`, {
    method,
    body: body.length > 0 ? body : undefined,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bitso ${API_KEY}:${nonce}:${signature}`,
    },
  });

  return response.json();
};

const getBalances = async () => {
  const { balances } = (await callRest("GET", ENDPOINTS.balance)).payload;

  return balances.filter(({ total }) => Number(total) > 0);
};

const placeOrder = async (book, amount) => {
  const body = {
    book,
    minor: amount,
    side: "buy",
    type: "market",
  };

  return callRest("POST", ENDPOINTS.order, JSON.stringify(body));
};

const balances = await getBalances();
const { available: mxnBalance } = balances.find(
  ({ currency }) => currency === "mxn"
);

console.log(`mxn: ${mxnBalance}`);

const {
  success: usdSuccess,
  payload: { oid: usdOid = "" } = { oid: "" },
  error: usdError,
} = await placeOrder(BOOKS.usd, MXN_TO_USD);

if (usdSuccess) {
  console.log(`usd-oid: ${usdOid}`);
} else {
  console.log(`usd-oid error: ${usdError.code}:${usdError.message}`);
}

const {
  success: btcSuccess,
  payload: { oid: btcOid = "" } = { oid: "" },
  error: btcError,
} = await placeOrder(BOOKS.btc, MXN_TO_BTC);

if (btcSuccess) {
  console.log(`btc-oid: ${btcOid}`);
} else {
  console.log(`btc-oid error: ${btcError.code}:${btcError.message}`);
}
