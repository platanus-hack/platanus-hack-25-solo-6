#!/usr/bin/env tsx
// Script to test Tavily service functionality

// IMPORTANT: Load environment variables BEFORE importing any services
import dotenv from "dotenv";
dotenv.config();

// Now import the service (this will use the env vars loaded above)
import { TavilyService } from "../services/tavily/tavily.service.js";

async function testTavilyService() {
  // Create service instance with API key from env
  const apiKey = process.env["TAVILY_API_KEY"];

  if (!apiKey) {
    console.error("❌ TAVILY_API_KEY not found in environment variables");
    console.error("Please check your .env file");
    process.exit(1);
  }

  console.log("✓ API key loaded successfully");
  const tavilyService = new TavilyService(apiKey);
  console.log("🔍 Testing Tavily Service...\n");

  try {
    // Test 1: Simple search
    console.log("Test 1: Simple search query");
    console.log("Query: 'What is TypeScript?'\n");

    const result1 = await tavilyService.search({
      query: "What is TypeScript?",
      searchDepth: "basic",
      includeAnswer: true,
      maxResults: 3,
    });

    console.log("✅ Search successful!");
    console.log(`Query: ${result1.query}`);
    console.log(`Number of results: ${result1.results.length}`);

    if (result1.answer) {
      console.log(`\nAnswer: ${result1.answer}`);
    }

    console.log("\nTop results:");
    result1.results.forEach((result, index) => {
      console.log(`\n${index + 1}. ${result.title}`);
      console.log(`   URL: ${result.url}`);
      console.log(`   Score: ${result.score}`);
      console.log(`   Content: ${result.content.substring(0, 150)}...`);
    });

    console.log("\n" + "=".repeat(80) + "\n");

    // Test 2: Multiple queries
    console.log("Test 2: Multiple queries in parallel");
    const queries = [
      "Latest AI developments 2024",
      "Machine learning best practices"
    ];
    console.log(`Queries: ${queries.join(", ")}\n`);

    const result2 = await tavilyService.searchMultipleQueries(queries);

    console.log("✅ Multiple queries successful!");
    console.log(`Total unique results: ${result2.length}`);
    console.log("\nTop 5 results by relevance:");
    result2.slice(0, 5).forEach((result, index) => {
      console.log(`\n${index + 1}. ${result.title}`);
      console.log(`   Score: ${result.score}`);
      console.log(`   URL: ${result.url}`);
    });

    console.log("\n" + "=".repeat(80) + "\n");

    // Test 3: Filter by relevance
    console.log("Test 3: Filter results by relevance score (>= 0.7)");
    const filteredResults = tavilyService.filterByRelevance(result2, 0.7);

    console.log(`✅ Filtered results: ${filteredResults.length}`);
    filteredResults.forEach((result, index) => {
      console.log(`\n${index + 1}. ${result.title}`);
      console.log(`   Score: ${result.score}`);
    });

    console.log("\n" + "=".repeat(80) + "\n");
    console.log("✅ All tests passed!");

  } catch (error) {
    console.error("\n❌ Error testing Tavily service:");
    if (error instanceof Error) {
      console.error(`Message: ${error.message}`);
      console.error(`Stack: ${error.stack}`);
    } else {
      console.error(error);
    }
    process.exit(1);
  }
}

// Run the test
testTavilyService();
