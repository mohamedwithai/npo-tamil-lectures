-- Remove the seed-created admin user that has no linked Google account.
-- This clears the OAuthAccountNotLinked error so a fresh Google sign-in can
-- create a properly linked user (createUser event re-grants ADMIN via ADMIN_EMAILS).
-- Cascades delete any Account/Session rows; lectures keep (authorId SetNull).
DELETE FROM "User" WHERE lower(email) = 'mohamedwithai@gmail.com';
