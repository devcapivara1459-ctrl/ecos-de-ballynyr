-- Additive upgrade of the original prototype. Take a backup before upgrading real data.
BEGIN;
CREATE TABLE IF NOT EXISTS characters (id TEXT PRIMARY KEY, name TEXT NOT NULL, assigned_invite UUID UNIQUE);
CREATE TABLE IF NOT EXISTS invites (
 id UUID PRIMARY KEY, token_hash TEXT NOT NULL UNIQUE, player_name TEXT,
 status TEXT NOT NULL DEFAULT 'new', character_id TEXT UNIQUE REFERENCES characters(id),
 answers JSONB, created_at TIMESTAMPTZ NOT NULL DEFAULT now(), completed_at TIMESTAMPTZ
);
ALTER TABLE invites ADD COLUMN IF NOT EXISTS session_hash TEXT;
ALTER TABLE invites ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ NOT NULL DEFAULT now()+interval '30 days';
ALTER TABLE invites ADD COLUMN IF NOT EXISTS progress JSONB NOT NULL DEFAULT '[]';
ALTER TABLE invites DROP CONSTRAINT IF EXISTS invites_status_check;
ALTER TABLE invites ADD CONSTRAINT invites_status_check CHECK(status IN ('new','started','completed','revoked'));
CREATE TABLE IF NOT EXISTS campaign_lock (id INTEGER PRIMARY KEY CHECK(id=1));
INSERT INTO campaign_lock VALUES(1) ON CONFLICT DO NOTHING;
CREATE TABLE IF NOT EXISTS audit_log (id BIGSERIAL PRIMARY KEY, event TEXT NOT NULL, invite_id UUID, created_at TIMESTAMPTZ NOT NULL DEFAULT now());
CREATE TABLE IF NOT EXISTS rate_limits (key TEXT PRIMARY KEY, hits INTEGER NOT NULL, reset_at TIMESTAMPTZ NOT NULL);
INSERT INTO characters(id,name) VALUES
 ('rhiona','Rhiona Mac Tuirenn'),('rowan','Rowan Lobo Castanho'),('muirenn','Muirenn da Lua Pálida'),
 ('cavan','Irmão Cavan'),('malik','Malik ibn Qamar'),('sira','Sira Cissé') ON CONFLICT DO NOTHING;

CREATE OR REPLACE FUNCTION ecos_rate(k TEXT, maximum INTEGER) RETURNS BOOLEAN LANGUAGE plpgsql AS $$
DECLARE n INTEGER;
BEGIN
 DELETE FROM rate_limits WHERE reset_at<now()-interval '1 day';
 INSERT INTO rate_limits VALUES(k,1,now()+interval '15 minutes')
 ON CONFLICT(key) DO UPDATE SET hits=CASE WHEN rate_limits.reset_at<now() THEN 1 ELSE rate_limits.hits+1 END,
 reset_at=CASE WHEN rate_limits.reset_at<now() THEN now()+interval '15 minutes' ELSE rate_limits.reset_at END RETURNING hits INTO n;
 RETURN n<=maximum;
END $$;

CREATE OR REPLACE FUNCTION ecos_create(i UUID,h TEXT,n TEXT) RETURNS BOOLEAN LANGUAGE plpgsql AS $$
BEGIN
 PERFORM id FROM campaign_lock WHERE id=1 FOR UPDATE;
 IF (SELECT count(*) FROM invites WHERE status<>'revoked')>=6 THEN RETURN false; END IF;
 INSERT INTO invites(id,token_hash,player_name) VALUES(i,h,n);
 INSERT INTO audit_log(event,invite_id) VALUES('invite_created',i);
 RETURN true;
END $$;

CREATE OR REPLACE FUNCTION ecos_start(h TEXT,s TEXT,n TEXT) RETURNS TEXT LANGUAGE plpgsql AS $$
DECLARE i invites%ROWTYPE;
BEGIN
 SELECT * INTO i FROM invites WHERE token_hash=h FOR UPDATE;
 IF NOT FOUND THEN RETURN 'invalid'; END IF;
 IF i.status IN ('started','completed') AND i.session_hash=s THEN RETURN i.status; END IF;
 IF i.status<>'new' THEN RETURN 'used'; END IF;
 IF i.expires_at<now() THEN RETURN 'expired'; END IF;
 UPDATE invites SET status='started',session_hash=s,player_name=COALESCE(player_name,n) WHERE id=i.id;
 INSERT INTO audit_log(event,invite_id) VALUES('journey_started',i.id);
 RETURN 'started';
END $$;

CREATE OR REPLACE FUNCTION ecos_finish(h TEXT,s TEXT,a JSONB,candidates TEXT[]) RETURNS TEXT LANGUAGE plpgsql AS $$
DECLARE i invites%ROWTYPE; chosen TEXT;
BEGIN
 -- Lock the campaign before the invite; every allocation uses the same order.
 PERFORM id FROM campaign_lock WHERE id=1 FOR UPDATE;
 SELECT * INTO i FROM invites WHERE token_hash=h FOR UPDATE;
 IF NOT FOUND OR i.session_hash IS DISTINCT FROM s OR i.status NOT IN ('started','completed') THEN RETURN NULL; END IF;
 IF i.status='completed' THEN RETURN i.character_id; END IF;
 SELECT c.id INTO chosen FROM unnest(candidates) WITH ORDINALITY r(id,ord)
 JOIN characters c ON c.id=r.id WHERE c.assigned_invite IS NULL ORDER BY r.ord LIMIT 1 FOR UPDATE OF c;
 IF chosen IS NULL THEN RETURN NULL; END IF;
 UPDATE characters SET assigned_invite=i.id WHERE id=chosen;
 UPDATE invites SET status='completed',character_id=chosen,answers=a,progress=a,completed_at=now() WHERE id=i.id;
 INSERT INTO audit_log(event,invite_id) VALUES('character_assigned',i.id);
 RETURN chosen;
END $$;

CREATE OR REPLACE FUNCTION ecos_manage(i UUID,action TEXT,h TEXT) RETURNS BOOLEAN LANGUAGE plpgsql AS $$
DECLARE current_status TEXT;
BEGIN
 PERFORM id FROM campaign_lock WHERE id=1 FOR UPDATE;
 SELECT status INTO current_status FROM invites WHERE id=i FOR UPDATE;
 IF NOT FOUND OR current_status NOT IN ('new','started') THEN RETURN false; END IF;
 IF action='rotate' THEN
 UPDATE invites SET token_hash=h,status='new',session_hash=NULL,progress='[]',expires_at=now()+interval '30 days' WHERE id=i;
 ELSIF action='revoke' THEN UPDATE invites SET status='revoked',session_hash=NULL WHERE id=i;
 ELSE RETURN false; END IF;
 INSERT INTO audit_log(event,invite_id) VALUES('invite_'||action,i);
 RETURN true;
END $$;
COMMIT;
