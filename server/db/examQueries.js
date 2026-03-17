import { query } from '../db.js';

// ── Get all problems (for lobby) ─────────────────────────────
export const getAllProblems = async (domainId = null) => {
  const result = await query(
    `SELECT p.id, p.title, p.difficulty, p."domainId", p."createdAt",
            d."domainName"
     FROM "Problems" p
     LEFT JOIN "Domains" d ON p."domainId" = d.id
     ${domainId ? 'WHERE p."domainId" = $1' : ''}
     ORDER BY
       CASE p.difficulty WHEN 'Easy' THEN 1 WHEN 'Medium' THEN 2 ELSE 3 END,
       p."createdAt" ASC`,
    domainId ? [domainId] : []
  );
  return result.rows;
};

// ── Get single problem + sample test cases (safe for client) ─
export const getProblemById = async (problemId) => {
  const pRes = await query(
    `SELECT p.id, p.title, p.description, p.difficulty,
            p."domainId", p."topicId", p."solutionUrl",
            d."domainName", t."topicName"
     FROM "Problems" p
     LEFT JOIN "Domains" d ON p."domainId" = d.id
     LEFT JOIN "Topics"  t ON p."topicId"  = t.id
     WHERE p.id = $1`,
    [problemId]
  );
  if (!pRes.rows.length) return null;

  const tcRes = await query(
    `SELECT id, input, expected_output, is_sample, points
     FROM "Test_Cases" WHERE "problemId" = $1
     ORDER BY is_sample DESC, id ASC`,
    [problemId]
  );

  const problem           = pRes.rows[0];
  problem.sampleTestCases = tcRes.rows.filter(t => t.is_sample);
  problem.totalTestCases  = tcRes.rows.length;
  problem.totalPoints     = tcRes.rows.reduce((s, t) => s + (t.points || 10), 0);
  return problem;
};

// ── Get ALL test cases (server only — used for submit) ────────
export const getAllTestCases = async (problemId) => {
  const result = await query(
    `SELECT id, input, expected_output, is_sample, points
     FROM "Test_Cases" WHERE "problemId" = $1 ORDER BY id ASC`,
    [problemId]
  );
  return result.rows;
};

// ── Save a submission ─────────────────────────────────────────
export const saveSubmission = async ({
  candidateId, problemId, language, code, status, score, results,
}) => {
  const r = await query(
    `INSERT INTO "Code_Submissions"
       ("candidateId","problemId",language,code,status,score,results,"submittedAt")
     VALUES ($1,$2,$3,$4,$5,$6,$7,NOW()) RETURNING *`,
    [candidateId, problemId, language, code, status, score, JSON.stringify(results)]
  );
  // keep Problem_Submissions in sync
  await query(
    `INSERT INTO "Problem_Submissions" ("candidateId","problemId",status,"solvedAt","attemptCount")
     VALUES ($1,$2,$3,NOW(),1)
     ON CONFLICT ("candidateId","problemId") DO UPDATE SET
       status        = CASE WHEN EXCLUDED.status='Solved'
                            THEN 'Solved'
                            ELSE "Problem_Submissions".status END,
       "attemptCount"= "Problem_Submissions"."attemptCount" + 1,
       "solvedAt"    = CASE WHEN EXCLUDED.status='Solved'
                            THEN NOW()
                            ELSE "Problem_Submissions"."solvedAt" END`,
    [candidateId, problemId, status]
  );
  return r.rows[0];
};

// ── Get candidate's past submissions for one problem ──────────
export const getCandidateSubmissions = async (candidateId, problemId) => {
  const r = await query(
    `SELECT id, language, status, score, "submittedAt"
     FROM "Code_Submissions"
     WHERE "candidateId"=$1 AND "problemId"=$2
     ORDER BY "submittedAt" DESC LIMIT 15`,
    [candidateId, problemId]
  );
  return r.rows;
};

// ── Seed 6 dummy problems with test cases ─────────────────────
export const seedDummyProblems = async () => {
  const existing = await query(`SELECT COUNT(*) FROM "Problems"`);
  if (parseInt(existing.rows[0].count) > 0)
    return { message: 'Already seeded — problems exist' };

  const domRes = await query(`SELECT id FROM "Domains" LIMIT 1`);
  const domainId = domRes.rows[0]?.id || 1;

  const PROBLEMS = [
    {
      title: 'FizzBuzz',
      difficulty: 'Easy',
      description: `Print numbers from 1 to n following these rules:
- Divisible by 3 → print "Fizz"
- Divisible by 5 → print "Buzz"
- Divisible by both → print "FizzBuzz"
- Otherwise → print the number

Each value on a new line.

Input: single integer n
Output: n lines

Example:
Input: 5
Output:
1
2
Fizz
4
Buzz`,
      testCases: [
        { input: '5',  expected: '1\n2\nFizz\n4\nBuzz', sample: true,  pts: 30 },
        { input: '3',  expected: '1\n2\nFizz',           sample: true,  pts: 20 },
        { input: '15', expected: '1\n2\nFizz\n4\nBuzz\nFizz\n7\n8\nFizz\nBuzz\n11\nFizz\n13\n14\nFizzBuzz', sample: false, pts: 50 },
      ],
    },
    {
      title: 'Reverse a String',
      difficulty: 'Easy',
      description: `Given a string, print it reversed.

Input: a single line string
Output: reversed string

Example:
Input: hello
Output: olleh`,
      testCases: [
        { input: 'hello',    expected: 'olleh',    sample: true,  pts: 25 },
        { input: 'racecar',  expected: 'racecar',  sample: true,  pts: 25 },
        { input: 'TierHire', expected: 'eriHreiT', sample: false, pts: 50 },
      ],
    },
    {
      title: 'Count Vowels',
      difficulty: 'Easy',
      description: `Count the number of vowels (a, e, i, o, u — case insensitive) in a string.

Input: a single line string
Output: integer count

Example:
Input: Hello World
Output: 3`,
      testCases: [
        { input: 'Hello World', expected: '3', sample: true,  pts: 25 },
        { input: 'aeiou',       expected: '5', sample: true,  pts: 25 },
        { input: 'rhythm',      expected: '0', sample: false, pts: 25 },
        { input: 'TierHire',    expected: '4', sample: false, pts: 25 },
      ],
    },
    {
      title: 'Two Sum',
      difficulty: 'Medium',
      description: `Given space-separated integers and a target on the next line,
print the 0-based indices of the two numbers that add up to the target.

Input:
Line 1: space-separated integers
Line 2: target integer

Output: two space-separated indices (e.g. "0 1")

Example:
Input:
2 7 11 15
9
Output: 0 1`,
      testCases: [
        { input: '2 7 11 15\n9', expected: '0 1', sample: true,  pts: 20 },
        { input: '3 2 4\n6',     expected: '1 2', sample: true,  pts: 20 },
        { input: '3 3\n6',       expected: '0 1', sample: false, pts: 30 },
        { input: '1 2 3 4 5\n9', expected: '3 4', sample: false, pts: 30 },
      ],
    },
    {
      title: 'Valid Parentheses',
      difficulty: 'Medium',
      description: `Determine if a string of brackets is valid.
Valid means every opening bracket is closed in the correct order.
Allowed characters: ( ) [ ] { }

Input: a string of brackets
Output: "true" or "false"

Example:
Input: ()[]{}
Output: true`,
      testCases: [
        { input: '()',      expected: 'true',  sample: true,  pts: 10 },
        { input: '()[]{}', expected: 'true',  sample: true,  pts: 10 },
        { input: '(]',     expected: 'false', sample: false, pts: 20 },
        { input: '([)]',   expected: 'false', sample: false, pts: 30 },
        { input: '{[]}',   expected: 'true',  sample: false, pts: 30 },
      ],
    },
    {
      title: 'Maximum Subarray',
      difficulty: 'Hard',
      description: `Find the contiguous subarray with the largest sum and print that sum.

Input: space-separated integers
Output: maximum subarray sum

Example:
Input: -2 1 -3 4 -1 2 1 -5 4
Output: 6`,
      testCases: [
        { input: '-2 1 -3 4 -1 2 1 -5 4', expected: '6',  sample: true,  pts: 20 },
        { input: '1',                      expected: '1',  sample: true,  pts: 10 },
        { input: '5 4 -1 7 8',             expected: '23', sample: false, pts: 30 },
        { input: '-1 -2 -3 -4',            expected: '-1', sample: false, pts: 40 },
      ],
    },
  ];

  for (const p of PROBLEMS) {
    const pRes = await query(
      `INSERT INTO "Problems" (title, description, difficulty, "domainId")
       VALUES ($1,$2,$3,$4) RETURNING id`,
      [p.title, p.description, p.difficulty, domainId]
    );
    const pid = pRes.rows[0].id;
    for (const tc of p.testCases) {
      await query(
        `INSERT INTO "Test_Cases" ("problemId", input, expected_output, is_sample, points)
         VALUES ($1,$2,$3,$4,$5)`,
        [pid, tc.input, tc.expected, tc.sample, tc.pts]
      );
    }
  }

  return { message: `Seeded ${PROBLEMS.length} problems with test cases` };
};