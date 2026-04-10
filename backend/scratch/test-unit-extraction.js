// backend/scratch/test-unit-extraction.js
/**
 * EXHAUSTIVE UNIT NORMALIZATION TEST
 */
const { normalizeCulinaryUnit } = require("../src/utils/culinaryMapping");

const testCases = [
  { name: "Water", quantity: 1, unit: "pcs", expected: { quantity: 250, unit: "ml" } },
  { name: "Garlic", quantity: 5, unit: "pcs", expected: { quantity: 5, unit: "cloves" } },
  { name: "Chicken", quantity: 2, unit: "pcs", expected: { quantity: 300, unit: "gram" } },
  { name: "Soy Sauce", quantity: 1, unit: "pcs", expected: { quantity: 250, unit: "ml" } },
  { name: "Flour", quantity: 2, unit: "pcs", expected: { quantity: 300, unit: "gram" } },
  { name: "Salt", quantity: 1, unit: "pcs", expected: { quantity: 150, unit: "gram" } }, // According to user's mapping gram/tsp
  { name: "Egg", quantity: 2, unit: "pcs", expected: { quantity: 2, unit: "pcs" } },
  { name: "Ginger", quantity: 1, unit: "pcs", expected: { quantity: 150, unit: "gram" } },
  { name: "Honey", quantity: 1, unit: "pcs", expected: { quantity: 150, unit: "gram" } },
  { name: "Maplesyrup", quantity: 1, unit: "pcs", expected: { quantity: 250, unit: "ml" } },
  { name: "Black pepper", quantity: 1, unit: "pcs", expected: { quantity: 150, unit: "gram" } },
  { name: "Tomato", quantity: 3, unit: "pcs", expected: { quantity: 3, unit: "pcs" } },
  { name: "Potato", quantity: 4, unit: "pcs", expected: { quantity: 4, unit: "pcs" } },
  { name: "Chicken Breast", quantity: 2, unit: "pcs", expected: { quantity: 300, unit: "gram" } }, 
  { name: "Paneer", quantity: 1, unit: "pcs", expected: { quantity: 150, unit: "gram" } }
];

console.log("=== STARTING EXHAUSTIVE CULINARY TESTS ===\n");

let passed = 0;
testCases.forEach((tc, i) => {
  const result = normalizeCulinaryUnit(tc.name, tc.unit, tc.quantity);
  const passedTest = result.quantity === tc.expected.quantity && result.unit === tc.expected.unit;
  
  if (passedTest) {
    console.log(`✅ Test ${i+1} [${tc.name}]: Passed`);
    passed++;
  } else {
    console.log(`❌ Test ${i+1} [${tc.name}]: Failed`);
    console.log(`   Input:    ${tc.quantity} ${tc.unit}`);
    console.log(`   Expected: ${tc.expected.quantity} ${tc.expected.unit}`);
    console.log(`   Got:      ${result.quantity} ${result.unit}`);
  }
});

console.log(`\n=== RESULTS: ${passed}/${testCases.length} PASSED ===`);
