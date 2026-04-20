-- Run this once to set up your database
-- mysql -u root -p < backend/schema.sql
-- dialect: mysql

CREATE DATABASE IF NOT EXISTS devcollab;
USE devcollab;

-- Users table (both students and faculty)
CREATE TABLE IF NOT EXISTS users (
  id           INT AUTO_INCREMENT PRIMARY KEY,
  name         VARCHAR(100)        NOT NULL,
  email        VARCHAR(150)        UNIQUE NOT NULL,
  password     VARCHAR(255)        NOT NULL,  -- bcrypt hash
  role         ENUM('student','faculty') NOT NULL,
  bio          TEXT,
  resume_link  VARCHAR(500),
  created_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Projects table
CREATE TABLE IF NOT EXISTS projects (
  id           INT AUTO_INCREMENT PRIMARY KEY,
  title        VARCHAR(200)        NOT NULL,
  description  TEXT                NOT NULL,
  skills       VARCHAR(500)        NOT NULL,
  slots        INT                 NOT NULL DEFAULT 1,
  type         ENUM('faculty','student') NOT NULL,
  owner_id     INT                 NOT NULL,
  created_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Applications table
CREATE TABLE IF NOT EXISTS applications (
  id             INT AUTO_INCREMENT PRIMARY KEY,
  project_id     INT  NOT NULL,
  student_id     INT  NOT NULL,
  skills         VARCHAR(500),
  resume_link    VARCHAR(500),
  message        TEXT,
  status         ENUM('Pending','Accepted','Rejected') DEFAULT 'Pending',
  rating         DECIMAL(3,1),
  feedback       TEXT,
  skills_gained  VARCHAR(500),
  progress       INT DEFAULT 0,
  remarks        TEXT,
  applied_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
  FOREIGN KEY (student_id) REFERENCES users(id)    ON DELETE CASCADE,
  UNIQUE KEY unique_application (project_id, student_id)
);

-- Migration: add progress/remarks to existing installs (safe to run multiple times)
ALTER TABLE applications
  ADD COLUMN IF NOT EXISTS progress INT DEFAULT 0,
  ADD COLUMN IF NOT EXISTS remarks  TEXT;
