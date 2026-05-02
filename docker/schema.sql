CREATE DATABASE IF NOT EXISTS nexus_hub
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE nexus_hub;

CREATE TABLE IF NOT EXISTS users (
  id            INT UNSIGNED         AUTO_INCREMENT PRIMARY KEY,
  username      VARCHAR(40)          NOT NULL UNIQUE,
  email         VARCHAR(120)         NOT NULL UNIQUE,
  password_hash VARCHAR(255)         NOT NULL,
  full_name     VARCHAR(121)         NOT NULL DEFAULT '',
  avatar        TEXT                 NOT NULL,
  role          ENUM('user','admin') NOT NULL DEFAULT 'user',
  is_active     TINYINT(1) UNSIGNED  NOT NULL DEFAULT 1,
  created_at    DATETIME             NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    DATETIME             NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS  teams (
  id          INT UNSIGNED  AUTO_INCREMENT PRIMARY KEY,
  name        VARCHAR(80)   NOT NULL,
  description TEXT          NOT NULL ,
  avatar      TEXT          NOT NULL,
  created_at  DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at  DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS  team_members (
  team_id   INT UNSIGNED                   NOT NULL,
  user_id   INT UNSIGNED                   NOT NULL,
  role      ENUM('owner','member')         NOT NULL DEFAULT 'member',
  joined_at DATETIME                       NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (team_id, user_id),
  FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS  tags (
  id    INT UNSIGNED  AUTO_INCREMENT PRIMARY KEY,
  name  VARCHAR(40)   NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS  projects (
  id          INT UNSIGNED                                     AUTO_INCREMENT PRIMARY KEY,
  team_id     INT UNSIGNED                                     NOT NULL,
  name        VARCHAR(120)                                     NOT NULL,
  description TEXT                                             NOT NULL,
  status      ENUM('planning','active','on_hold','completed')  NOT NULL DEFAULT 'planning',
  priority    ENUM('low','medium','high','critical')           NOT NULL DEFAULT 'medium',
  deadline    DATE                                             NOT NULL DEFAULT (CURDATE()),
  created_at  DATETIME                                         NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at  DATETIME                                         NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS  project_tags (
  project_id INT UNSIGNED NOT NULL,
  tag_id     INT UNSIGNED NOT NULL,
  PRIMARY KEY (project_id, tag_id),
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
  FOREIGN KEY (tag_id)     REFERENCES tags(id)     ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS   project_watchers (
  project_id     INT UNSIGNED NOT NULL,
  user_id        INT UNSIGNED NOT NULL,
  watching_since DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (project_id, user_id),
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id)    REFERENCES users(id)    ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS  tasks (
  id                  INT UNSIGNED                           AUTO_INCREMENT PRIMARY KEY,
  project_id          INT UNSIGNED                           NOT NULL,
  created_by_user_id  INT UNSIGNED                           NOT NULL,
  title               VARCHAR(200)                           NOT NULL,
  description         TEXT                                   NOT NULL,
  status              ENUM('todo','in_progress','done')      NOT NULL DEFAULT 'todo',
  priority            ENUM('low','medium','high','critical') NOT NULL DEFAULT 'medium',
  deadline            DATE                                   NOT NULL DEFAULT (CURDATE()),
  estimated_hours     DECIMAL(6,2) UNSIGNED                  NOT NULL DEFAULT 0.00,
  created_at          DATETIME                               NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at          DATETIME                               NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (project_id)         REFERENCES projects(id) ON DELETE CASCADE,
  FOREIGN KEY (created_by_user_id) REFERENCES users(id)    ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS  task_assignees (
  task_id     INT UNSIGNED NOT NULL,
  user_id     INT UNSIGNED NOT NULL,
  assigned_by INT UNSIGNED NOT NULL,
  assigned_at DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (task_id, user_id),
  FOREIGN KEY (task_id)     REFERENCES tasks(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id)     REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (assigned_by) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS  comments (
  id         INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  task_id    INT UNSIGNED NOT NULL,
  user_id    INT UNSIGNED NOT NULL,
  content    TEXT         NOT NULL,
  created_at DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS  audits (
  id          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id     INT UNSIGNED NULL,
  action      VARCHAR(80)  NOT NULL,
  entity_type VARCHAR(40)  NULL,
  entity_id   INT UNSIGNED NULL,
  detail      TEXT         NULL,
  created_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

