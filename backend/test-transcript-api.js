const { YoutubeTranscript } = require("youtube-transcript-api");

async function test(id) {
  try {
    const transcript = await YoutubeTranscript.fetchTranscript(id);
    console.log(`Transcript for ${id} length:`, transcript.length);
    if (transcript.length > 0) console.log("First item:", transcript[0]);
  } catch (err) {
    console.error(`Error for ${id}:`, err.message);
  }
}

async function runTests() {
  await test("D_2DBLAt57c");
  await test("dQw4w9WgXcQ");
}

runTests();
