-- Seed script: creates one example wedding
INSERT INTO weddings (
  name,
  date,
  invite_code,
  admin_token,
  submissions_open,
  created_at_utc,
  updated_at_utc
) VALUES (
  'Sample Wedding',
  '2025-06-01',
  'INV123',
  'ADMIN_TOKEN_SAMPLE_CHANGE_ME_1234567890',
  1,
  '2024-01-01T00:00:00.000Z',
  '2024-01-01T00:00:00.000Z'
);

INSERT INTO submissions (
  wedding_id,
  display_name,
  submitted_at_utc,
  q1_whose_wedding,
  q2_your_name,
  q3_neon_sign,
  q4_photo_booth,
  q5_sweetheart_table,
  q6_choreographed_first_dance,
  q7_best_man_speech_over_under,
  q8_maid_of_honor_speech_over_under,
  q9_best_man_beautiful_thank_parents,
  q10_job_mentioned,
  q11_bouquet_toss,
  q12_dress_change,
  q13_tiebreaker
) VALUES (
  (SELECT id FROM weddings WHERE invite_code = 'INV123'),
  'Sample Guest',
  '2024-01-01T01:00:00.000Z',
  'Sample Couple',
  'Sample Guest',
  'Yes',
  'No',
  'Yes',
  'No',
  'Over',
  'Under',
  'Yes',
  'No',
  'Yes',
  'No',
  '11:45 PM'
);
