-- Fix: ad_reads unique constraint should include tab_source
-- Previously UNIQUE (ad_id, user_id) meant only the FIRST read was counted,
-- regardless of which tab it came from. A user reading an ad in all-reklam (1kr)
-- would block the same read in intressereklam (3kr) from being recorded.
-- Fix: allow one read per (user, ad, tab) so each tab is charged correctly.

ALTER TABLE ad_reads DROP CONSTRAINT IF EXISTS ad_reads_ad_id_user_id_key;
ALTER TABLE ad_reads ADD CONSTRAINT ad_reads_ad_id_user_id_tab_source_key UNIQUE (ad_id, user_id, tab_source);
