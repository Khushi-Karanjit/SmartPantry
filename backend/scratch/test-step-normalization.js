// backend/scratch/test-step-normalization.js
/**
 * PROFESSIONAL STEP NORMALIZATION TEST
 */

// Simulated cleanSteps logic from ai.service.js
function cleanSteps(steps) {
  if (!steps || !Array.isArray(steps)) return [];
  
  const masterVerbs = /^(Cook|Heat|Add|Mix|Boil|Fry|Stir|Combine|Prepare|Pour|Simmer|Sift|Whisk|Slice|Chop|Grate|Season|Drain|Melt|Brown|Spread|Sauté|Sear|Toast|Bake|Roast|Grill|Place|Bring|Cover|Reduce|Layer|Top|Garnish|Serve|Whisk|Preheat|Grease|Flour|Cream|Start|Begin|Transfer|Blend|Whisk|Beat)/i;

  return steps
    .map((s, i) => {
       let text = s.text ? s.text.trim() : "";
       text = text.replace(/^(i'm going to|i'm gonna|we're going to|we're gonna|let's|i like to|we need to|i'll|we'll)\s+/i, "");
       text = text.replace(/^(i|we|my|me|us|our)\s+(will|would|can|could|should|must)\s+/i, "");
       
       // NORMALIZE SPACING: (e.g., "100g" -> "100 g")
       text = text.replace(/(\d+)([a-zA-Z]+)/g, "$1 $2");
       
       // REMOVE DUPLICATE PUNCTUATION: (e.g., ".." -> ".")
       text = text.replace(/\.{2,}/g, ".");
       
       // ACTION INJECTOR: If step starts with a number/quantity, prepend "Add "
       // (Unless it's the first step and we're about to add a lead-in)
       if (/^\d/.test(text.trim()) && !text.toLowerCase().startsWith("add")) {
         text = "Add " + text;
       }

       // LEAD-IN INJECTOR: For the first step, start with "Start by"
       if (i === 0 && !/^(Start|Begin)/i.test(text)) {
         // If we added "Add " above, let's make it "Start by adding"
         if (text.startsWith("Add ")) {
           text = "Start by adding " + text.slice(4).charAt(0).toLowerCase() + text.slice(5);
         } else {
           text = "Start by preparing " + text.charAt(0).toLowerCase() + text.slice(1);
         }
       }

       return { ...s, text: text.trim().charAt(0).toUpperCase() + text.slice(1) };
    })
    .filter(s => s.text.length > 8)
    .filter(s => masterVerbs.test(s.text))
    .slice(0, 10)
    .map((s, i) => ({
      text: s.text.endsWith(".") ? s.text : s.text + ".",
      startTime: s.startTime || 0,
      step: i + 1
    }));
}

const testCases = [
  {
    name: "User Example: Fragmented & Messy",
    input: [
      { text: "100g of apricots. Remove the pits. Transfer to a blender.." }
    ],
    expected: "Start by preparing Add 100 g of apricots. Remove the pits. Transfer to a blender."
  },
  {
    name: "Action Injector: Missing Verb",
    input: [
      { text: "1 teaspoon of ghee"},
      { text: "40g of flour"}
    ],
    expected: "Start by preparing Add 1 teaspoon of ghee. Add 40 g of flour."
  },
  {
    name: "Punctuation Cleaning",
    input: [
      { text: "Mix it well..." }
    ],
    expected: "Start by preparing mix it well."
  }
];

console.log("=== STARTING PROFESSIONAL STEP TESTS ===\n");

testCases.forEach((tc, i) => {
  const result = cleanSteps(tc.input);
  const resultText = result.map(s => s.text).join(" ");
  
  console.log(`Test ${i+1}: ${tc.name}`);
  console.log(`Input:    "${tc.input.map(s => s.text).join(" | ")}"`);
  console.log(`Result:   "${resultText}"`);
  console.log("-" .repeat(40));
});

console.log("\n=== TESTS COMPLETED ===");
