// Report of posts/blogs whose "title" exceeds TITLE_MAX_LENGTH characters (Unicode code points).
// Read-only: does not modify any document. Run this before truncateLongTitles.js.
// Usage: mongo <dbname> checkLongTitles.js | tee check-long-titles-report.log

const TITLE_MAX_LENGTH = 60;
const COLLECTIONS = ["posts", "blogs"];

print("=== CHECK LONG TITLES ===\n");

const query = {
  title: { $type: "string" },
  $expr: { $gt: [{ $strLenCP: "$title" }, TITLE_MAX_LENGTH] }
};

const stats = [];

COLLECTIONS.forEach(collectionName => {
  const collection = db.getCollection(collectionName);
  // estimatedDocumentCount() reads collection metadata (no full scan), so it stays fast
  // even on a collection with several million documents.
  const total = collection.estimatedDocumentCount();
  const cursor = collection.find(query, { title: 1 });
  let matched = 0;

  try {
    cursor.forEach(doc => {
      matched++;
      const length = Array.from(doc.title).length;
      const preview = Array.from(doc.title).slice(0, TITLE_MAX_LENGTH).join("").trimEnd();
      print(`[${collectionName}] [${doc._id}] length=${length} -> "${preview}"`);
    });
  } finally {
    cursor.close();
  }

  const percentage = total > 0 ? (matched / total * 100).toFixed(2) : "0.00";
  print(`\n--- ${collectionName} : ${matched}/${total} long titles (${percentage}%) ---\n`);
  stats.push({ collectionName, total, matched, percentage });
});

print(`=== SUMMARY ===`);
stats.forEach(({ collectionName, total, matched, percentage }) => {
  print(`${collectionName} : total=${total} / long titles=${matched} (${percentage}%)`);
});
print(`\nRun truncateLongTitles.js (DRY_RUN=true first) to apply.`);
