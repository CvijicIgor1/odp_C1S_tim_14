CREATE TABLE users (
  id            INT                  AUTO_INCREMENT PRIMARY KEY,
  username      VARCHAR(40)          NOT NULL UNIQUE,
  email         VARCHAR(120)         NOT NULL UNIQUE,
  passwordHash  VARCHAR(255)         NOT NULL,
  FullName     VARCHAR(120)          NOT NULL,
  avatar        TEXT                 NOT NULL DEFAULT '',
  role          ENUM('user','admin') NOT NULL DEFAULT 'user',
  isActive      TINYINT(1)           NOT NULL DEFAULT 1,
  createdAt     DATETIME             NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt     DATETIME             NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE teams (
  id          INT           AUTO_INCREMENT PRIMARY KEY,
  name        VARCHAR(80)   NOT NULL,
  description TEXT          NOT NULL DEFAULT '',
  avatar      TEXT          NOT NULL DEFAULT '',
  createdAt   DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt   DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE team_members (
  teamId    INT                            NOT NULL,
  userId    INT                            NOT NULL,
  role      ENUM('owner','member')         NOT NULL DEFAULT 'member',
  joinedAt  DATETIME                       NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (teamId, userId),
  FOREIGN KEY (teamId) REFERENCES teams(id) ON DELETE CASCADE,
  FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE tags (
  id    INT           AUTO_INCREMENT PRIMARY KEY,
  name  VARCHAR(40)   NOT NULL UNIQUE
);

CREATE TABLE projects (
  id          INT                                              AUTO_INCREMENT PRIMARY KEY,
  teamId      INT                                              NOT NULL,
  name        VARCHAR(120)                                     NOT NULL,
  description TEXT                                             NOT NULL DEFAULT '',
  status      ENUM('planning','active','on_hold','completed')  NOT NULL DEFAULT 'planning',
  priority    ENUM('low','medium','high','critical')           NOT NULL DEFAULT 'medium',
  deadline    DATE                                             NOT NULL DEFAULT (CURDATE()),
  createdAt   DATETIME                                         NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt   DATETIME                                         NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (teamId) REFERENCES teams(id) ON DELETE CASCADE
);

CREATE TABLE project_tags (
  projectId INT NOT NULL,
  tagId     INT NOT NULL,
  PRIMARY KEY (projectId, tagId),
  FOREIGN KEY (projectId) REFERENCES projects(id) ON DELETE CASCADE,
  FOREIGN KEY (tagId)     REFERENCES tags(id)     ON DELETE CASCADE
);

CREATE TABLE project_watchers (
  projectId     INT          NOT NULL,
  userId        INT          NOT NULL,
  watchingSince DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (projectId, userId),
  FOREIGN KEY (projectId) REFERENCES projects(id) ON DELETE CASCADE,
  FOREIGN KEY (userId)    REFERENCES users(id)    ON DELETE CASCADE
);

CREATE TABLE tasks (
  id               INT                                    AUTO_INCREMENT PRIMARY KEY,
  projectId        INT                                    NOT NULL,
  createdByUserId  INT                                    NOT NULL,
  title            VARCHAR(200)                           NOT NULL,
  description      TEXT                                   NOT NULL DEFAULT '',
  status           ENUM('todo','in_progress','done')      NOT NULL DEFAULT 'todo',
  priority         ENUM('low','medium','high','critical') NOT NULL DEFAULT 'medium',
  deadline         DATE                                   NOT NULL DEFAULT (CURDATE()),
  estimatedHours   DECIMAL(6,2)                           NOT NULL DEFAULT 0.00,
  createdAt        DATETIME                               NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt        DATETIME                               NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (projectId)       REFERENCES projects(id) ON DELETE CASCADE,
  FOREIGN KEY (createdByUserId) REFERENCES users(id)    ON DELETE CASCADE
);

CREATE TABLE task_assignees (
  taskId      INT          NOT NULL,
  userId      INT          NOT NULL,
  assignedBy  INT          NOT NULL,
  assignedAt  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (taskId, userId),
  FOREIGN KEY (taskId)     REFERENCES tasks(id) ON DELETE CASCADE,
  FOREIGN KEY (userId)     REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (assignedBy) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE comments (
  id        INT          AUTO_INCREMENT PRIMARY KEY,
  taskId    INT          NOT NULL,
  userId    INT          NOT NULL,
  content   TEXT         NOT NULL,
  createdAt DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (taskId) REFERENCES tasks(id) ON DELETE CASCADE,
  FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE audits (
  id            INT          AUTO_INCREMENT PRIMARY KEY,
  actorId       INT          NOT NULL DEFAULT 0,
  actorUsername VARCHAR(40)  NOT NULL DEFAULT 'system',
  action        VARCHAR(80)  NOT NULL,
  entityType    VARCHAR(40)  NOT NULL DEFAULT '',
  entityId      INT          NOT NULL DEFAULT 0,
  detail        TEXT         NOT NULL DEFAULT '',
  createdAt     DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP
);
