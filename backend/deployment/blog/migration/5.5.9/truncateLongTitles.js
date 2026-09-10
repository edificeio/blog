// Truncates "title" to TITLE_MAX_LENGTH characters (Unicode code points) for db.posts and db.blogs.
// The original title is preserved in "oldTitle" for audit/rollback.
// Idempotent: a document already truncated (title.length <= TITLE_MAX_LENGTH) never matches again.
//
// Usage:
//   1. mongo <dbname> checkLongTitles.js                                  (see what will change)
//   2. mongo <dbname> truncateLongTitles.js                               (dry-run by default: prints, writes nothing)
//   3. mongo <dbname> --eval "var DRY_RUN = false;" truncateLongTitles.js  (apply)
//
// The mongo shell (legacy, not mongosh) has no process.env: DRY_RUN is overridden via --eval
// (set before the script loads), not via an OS environment variable.

const TITLE_MAX_LENGTH = 60;
const BATCH_SIZE = 500;
// var, not const: lets --eval "var DRY_RUN = false;" define it before this file runs.
if (typeof DRY_RUN === "undefined") {
  var DRY_RUN = true;
}
const COLLECTIONS = ["posts", "blogs"];

print("=== TRUNCATE LONG TITLES ===\n");

const query = {
  title: { $type: "string" },
  $expr: { $gt: [{ $strLenCP: "$title" }, TITLE_MAX_LENGTH] }
};

function truncate(title) {
  return Array.from(title).slice(0, TITLE_MAX_LENGTH).join("").trimEnd();
}

let grandTotalMatched = 0;
let grandTotalModified = 0;

COLLECTIONS.forEach(collectionName => {
  const collection = db.getCollection(collectionName);
  const cursor = collection.find(query, { title: 1 });

  let matched = 0;
  let modified = 0;
  let batch = [];

  const flush = () => {
    if (batch.length === 0) return;
    const result = collection.bulkWrite(batch, { ordered: false });
    modified += result.modifiedCount;
    print(`[${collectionName}] batch of ${batch.length} -> modified ${result.modifiedCount}`);
    batch = [];
  };

  try {
    cursor.forEach(doc => {
      matched++;
      const newTitle = truncate(doc.title);

      if (DRY_RUN) {
        print(`[DRY-RUN][${collectionName}] [${doc._id}] "${doc.title}" (${Array.from(doc.title).length} chars) -> "${newTitle}"`);
        return;
      }

      batch.push({
        updateOne: {
          filter: { _id: doc._id, title: doc.title }, // avoids clobbering a title edited concurrently
          update: { $set: { title: newTitle, oldTitle: doc.title } }
        }
      });

      if (batch.length >= BATCH_SIZE) flush();
    });

    if (!DRY_RUN) flush();
  } finally {
    cursor.close();
  }

  print(`\n--- ${collectionName} : matched=${matched}${DRY_RUN ? "" : ` modified=${modified}`} ---\n`);
  grandTotalMatched += matched;
  grandTotalModified += modified;
});

print(`=== SUMMARY ===`);
if (DRY_RUN) {
  print(`[DRY-RUN] ${grandTotalMatched} documents would be modified (posts + blogs)`);
  print(`Set DRY_RUN = false to apply.`);
} else {
  print(`[APPLIED] Total modified: ${grandTotalModified} (posts + blogs)`);
  print(`Original titles preserved in the "oldTitle" field.`);
}
