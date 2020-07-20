\echo
\echo 'Please enter the name of the schema that will contain the `audit_event` type and `get_audit_information` function:'
\echo 'This schema should be exposed by postgraphile and can be different from the pgMemento schema'
\prompt '[example: "public"] ' schema_name

SET search_path TO :'schema_name', 'public' ;

CREATE TYPE audit_event AS ( id BIGINT,
audit_id BIGINT,
event_key TEXT,
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
SELECT
	rl.id,
	rl.audit_id,
	rl.event_key,
	tr.id AS transaction_id,
	tr.user_name,
	te.stmt_time,
	COALESCE(tr.session_info,
	'{}'::JSONB) AS session_info,
	rl.old_data AS values_before,
	rl.new_data AS values_after
FROM
	pgmemento.transaction_log tr
JOIN pgmemento.table_event_log te ON
	tr.id = te.transaction_id
JOIN pgmemento.row_log rl ON
	te.event_key = rl.event_key
WHERE
	rl.audit_id = _audit_id
	
$$ Language SQL stable;
