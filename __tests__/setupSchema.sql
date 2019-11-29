START TRANSACTION;

-- WARNING: this database is shared with postgraphile-core, don't run the tests in parallel!
DROP SCHEMA IF EXISTS postgraphile_audit_plugin CASCADE;

CREATE SCHEMA postgraphile_audit_plugin;

\echo
\echo 'Create event trigger to log schema changes ...'
SELECT pgmemento.create_schema_event_trigger(TRUE);

\echo
\echo 'Start auditing for tables in "postgraphile_audit_plugin" schema ...'
SELECT pgmemento.create_schema_audit('postgraphile_audit_plugin', TRUE, array[]::text[]);


CREATE TABLE postgraphile_audit_plugin.users (
	id SERIAL PRIMARY KEY,
	first_name TEXT NOT NULL,
	last_name TEXT NOT NULL
);

CREATE TABLE postgraphile_audit_plugin.emails (
	id SERIAL PRIMARY KEY,
	email TEXT NOT NULL
);

CREATE TABLE postgraphile_audit_plugin.users_emails (
	user_id INT NOT NULL REFERENCES postgraphile_audit_plugin.users(id),
	email_id INT NOT NULL REFERENCES postgraphile_audit_plugin.emails(id),
	PRIMARY KEY (
		user_id,
		email_id
	)
) ;

INSERT
	INTO
	postgraphile_audit_plugin.users (
		id,
		first_name,
		last_name
	)
VALUES (
	1,
	'alicia',
	'keys'
),
(
	2,
	'bob',
	'marley'
),
(
	3,
	'charles',
	'bradley'
);

INSERT
	INTO
	postgraphile_audit_plugin.emails (
		id,
		email
	)
VALUES (
	1,
	'piano@example.com'
),
(
	2,
	'alicia@example.com'
);

INSERT
	INTO
	postgraphile_audit_plugin.users_emails (
		user_id,
		email_id
	)
VALUES (
	1,
	1
),
(
	1,
	2
);

COMMIT;