/**
 * Test script — validates your Linear API key works correctly.
 * Run: node test-linear-api.mjs
 */

import { config } from "dotenv";
config({ path: ".env.local" });

const apiKey = process.env.LINEAR_API_KEY;

if (!apiKey) {
  console.error("❌ LINEAR_API_KEY not found in .env.local");
  process.exit(1);
}

console.log("🔑 API Key loaded:", apiKey.substring(0, 20) + "...");
console.log("📡 Calling Linear API (no Bearer prefix)...\n");

const query = `
  query {
    viewer {
      id
      email
      displayName
      name
    }
  }
`;

const response = await fetch("https://api.linear.app/graphql", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "Authorization": apiKey,
  },
  body: JSON.stringify({ query }),
});

const text = await response.text();

console.log("📨 Status:", response.status, response.statusText);
console.log("📨 Response:", text);

if (response.ok) {
  const data = JSON.parse(text);
  if (data.data?.viewer) {
    console.log("\n✅ SUCCESS! Your Linear API connection works!");
    console.log("   User:", data.data.viewer.displayName);
    console.log("   Email:", data.data.viewer.email);
  }
} else {
  console.log("\n❌ FAILED. Check your API key.");
}
