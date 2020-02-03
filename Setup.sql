\echo
\echo 'Please enter the name of the schema that will contain the `audit_event` type and `get_audit_information` function:'
\echo 'This schema should be exposed by postgraphile and can be different from the pgMemento schema'
\prompt '[example: "public"] ' schema_name

SET search_path TO :'schema_name', 'public' ;

CREATE TYPE audit_event AS ( id BIGINT,
audit_id BIGINT,
event_id INT,
transaction_id INT,
user_name TEXT,
stmt_date TIMESTAMPTZ,
session_info jsonb,
values_before jsonb,
values_after jsonb);

CREATE OR REPLACE FUNCTION get_audit_information (
_audit_id BIGINT,
_schema_name text,
_table_name text
) RETURNS SETOF audit_event AS $$
WITH audits AS (
SELECT
	rl.id,
	rl.audit_id,
	rl.event_id,
	tr.id AS transaction_id,
	tr.user_name,
	tr.stmt_date,
	COALESCE(tr.session_info,
	'{}'::JSONB) AS session_info,
	rl.changes AS values_before
FROM
	pgmemento.transaction_log tr
JOIN pgmemento.table_event_log te ON
	tr.id = te.transaction_id
JOIN pgmemento.row_log rl ON
	te.id = rl.event_id )
SELECT
	*,
	(
	SELECT
		values_after - 'audit_id' AS values_after
	FROM
		pgmemento.restore_record
		(
			CASE WHEN values_before IS NULL THEN 1
			ELSE audits.event_id::INT
	END,
		audits.event_id::INT + 1,
		_table_name,
		_schema_name,
		_audit_id,
		TRUE) AS (values_after JSONB))
FROM
	audits
WHERE
	audits.audit_id = _audit_id
	
	$$ Language SQL stable;