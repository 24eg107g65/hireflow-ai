ALTER TABLE resumes ADD COLUMN relative_path VARCHAR(160);

UPDATE resumes SET relative_path = stored_filename;

ALTER TABLE resumes MODIFY relative_path VARCHAR(160) NOT NULL;