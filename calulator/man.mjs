import fetch from 'node-fetch';

const WINDOW_SIZE = 10;
const numberStore = { p: [], f: [], e: [], r: [] };
let accessToken = '';

const credentials = {
  companyName: "Turing",
  clientID: "12225a01-5eea-4cc1-b80f-0756ba9612a4",
  clientSecret: "hAyyGrnZNXpvhYDR",
  ownerName: "vanshika gahlot",
  ownerEmail: "vanshikagahlot561@gmail.com",
  rollNo: "22103283",
  name: "Vanshika Gahlot", 
  email: "vanshikagahlot561@gmail.com",
  accessCode: "SrMQqR" 
};

async function fetchToken() {
  try {
    const res = await fetch("http://20.244.56.144/evaluation-service/auth", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(credentials)
    });

    const data = await res.json();
    if (!data.access_token) throw new Error("Invalid token response");

    accessToken = data.access_token;
  } catch (err) {
    console.error("Token fetch error:", err.message);
  }
}

async function fetchNumbers(type) {
  const typeMap = { p: "primes", f: "fibo", e: "even", r: "rand" };
  const endpoint = `http://20.244.56.144/evaluation-service/${typeMap[type]}`;

  try {
    if (!accessToken) await fetchToken();

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 500);

    const res = await fetch(endpoint, {
      signal: controller.signal,
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: "application/json",
        "Content-Type": "application/json"
      }
    });

    clearTimeout(timeout);

    if (res.status === 401) {
      await fetchToken();
      return fetchNumbers(type);
    }

    const data = await res.json();
    return data.numbers || [];
  } catch {
    return [];
  }
}

function processNumbers(type, nums) {
  const prev = [...numberStore[type]];

  for (const n of nums) {
    if (!numberStore[type].includes(n)) {
      if (numberStore[type].length >= WINDOW_SIZE) {
        numberStore[type].shift();
      }
      numberStore[type].push(n);
    }
  }

  const avg = numberStore[type].length
    ? numberStore[type].reduce((a, b) => a + b, 0) / numberStore[type].length
    : 0;

  return {
    windowPrevState: prev,
    windowCurrState: [...numberStore[type]],
    avg
  };
}

async function handleType(type) {
  const nums = await fetchNumbers(type);
  const result = processNumbers(type, nums);

  console.log(`\n ${getTypeName(type)} Numbers`);
  console.log("   Received:", nums.join(", "));
  console.log("   Prev Window:", result.windowPrevState.join(", "));
  console.log("   Curr Window:", result.windowCurrState.join(", "));
  console.log("   Average:", result.avg.toFixed(2));
}

function getTypeName(type) {
  return {
    p: "Prime",
    f: "Fibonacci",
    e: "Even",
    r: "Random"
  }[type] || "Unknown";
}

async function runDemo() {
  await fetchToken();
  await handleType('p');
  await handleType('f');
  await handleType('e');
  await handleType('r');
}

runDemo();
