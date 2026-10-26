/**
 * Synthetic sample documents for the Workbench. They are written for this
 * site and describe no real system.
 */
export const SAMPLES: Record<string, { fileName: string; query: string; text: string }> = {
  retrieval: {
    fileName: "synthetic-retrieval-notes.md",
    query: "What handles a scanned PDF?",
    text: `# Synthetic retrieval design notes

These notes are invented sample text for the Proof Workbench.

## Ingestion
Uploaded files are checked by type and size before anything else happens.
Scanned PDFs have no text layer, so they are routed to optical character recognition before chunking.
Spreadsheets are summarised row by row so numbers stay attached to their headers.

## Chunking
Text is split on paragraph boundaries into chunks of roughly 900 characters.
Each chunk keeps its character offsets and line numbers so any quote can be traced back to the original file.

## Retrieval
Two rankings are produced for every question.
The lexical ranking uses BM25, which rewards rare words that appear often in a chunk.
The semantic ranking uses dense vector similarity, which can match paraphrases that share no words.
Reciprocal rank fusion merges the two rankings: each chunk scores 1 / (k + rank) in each list, with k = 60.

## Answering
The model may only answer from retrieved chunks.
Every sentence must cite a chunk; an answer with a missing or invalid citation is replaced by an abstention.
When no chunk is relevant, the system says it cannot answer rather than guessing.

## Failure handling
If the vector store is unavailable, the lexical ranking still works and the answer is labelled as lexical-only.
If the model times out, the user sees the retrieved passages instead of an answer.
`,
  },
  incident: {
    fileName: "synthetic-incident-runbook.txt",
    query: "Why do checkout requests time out?",
    text: `SYNTHETIC RUNBOOK — invented for the Proof Workbench

Symptom: checkout requests time out after 30 seconds.
First check the payment gateway health endpoint and the queue depth dashboard.
If queue depth is above 10,000 messages, scale the consumer group before restarting anything.

Known cause A: an expired TLS certificate on the internal payment proxy.
Fix: rotate the certificate, then restart the proxy pods one at a time.

Known cause B: a slow database query after a schema migration.
Fix: roll back the migration or add the missing index on orders.created_at.

Escalation: page the on-call database engineer if latency persists for more than 15 minutes after scaling.
Never purge the queue without approval; messages represent customer payments.
`,
  },
};
